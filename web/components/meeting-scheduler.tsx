'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, CheckCircle2, X, Sparkles, Plus, Trash2, Video, ExternalLink, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Provider = 'google' | 'teams'

interface MeetingAttendee {
  name: string
  email: string | null
  matched: boolean
}

interface MeetingSchedulerProps {
  initialTitle: string
  initialDescription?: string
  initialLocation?: string
  initialStartTime: string
  initialEndTime: string
  initialAttendees?: MeetingAttendee[]
  initialProvider: Provider
  availableProviders: { google: boolean; teams: boolean }
  onSuccess?: (result: { meetingUrl: string | null; provider: string }) => void
  onClose?: () => void
}

type PersonSuggestion = { name: string; email: string }

const EMAIL_IN_TEXT = /<([^>]+)>|([^\s<>]+@[^\s<>]+\.[^\s<>]+)/

function cleanAttendeeText(text: string): string {
  let value = text.trim()
  value = value.replace(/^\[\s*/, '').replace(/\s*\]$/, '')
  value = value.replace(/^['"]|['"]$/g, '').trim()
  return value
}

function parseAttendeeText(text: string): { name: string; email: string | null } {
  const trimmed = cleanAttendeeText(text)
  const match = trimmed.match(EMAIL_IN_TEXT)
  const email = match ? (match[1] || match[2]) : null
  const name = email ? trimmed.replace(/<[^>]*>/, '').trim() || email : trimmed
  return { name, email }
}

function AttendeeRow({
  attendee,
  onChange,
  onRemove,
}: {
  attendee: MeetingAttendee
  onChange: (patch: MeetingAttendee) => void
  onRemove: () => void
}) {
  const initial = attendee.name && attendee.name !== attendee.email
    ? attendee.name
    : attendee.email || attendee.name || ''
  const [text, setText] = useState(cleanAttendeeText(initial))
  const [suggestions, setSuggestions] = useState<PersonSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const justPicked = useRef(false)

  useEffect(() => {
    if (justPicked.current) {
      justPicked.current = false
      return
    }
    const q = text.trim()
    if (q.length < 2 || EMAIL_IN_TEXT.test(q)) {
      setSuggestions([])
      return
    }
    const handle = setTimeout(async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/people/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setSuggestions(data.people || [])
        setOpen((data.people || []).length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(handle)
  }, [text])

  const commit = (value: string) => {
    const parsed = parseAttendeeText(value)
    onChange({ name: parsed.name, email: parsed.email, matched: !!parsed.email })
  }

  const pick = (s: PersonSuggestion) => {
    justPicked.current = true
    setText(s.name)
    setOpen(false)
    setSuggestions([])
    onChange({ name: s.name, email: s.email, matched: true })
  }

  const unresolved = !attendee.email

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cf-text-muted)]" />
          <Input
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              commit(e.target.value)
            }}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Type a name or email…"
            className={cn(
              'h-8 text-sm pl-7',
              unresolved && text.trim() && 'border-amber-500/60',
            )}
          />
          {loading && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-[var(--cf-text-muted)]" />
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5 text-slate-400" />
        </Button>
      </div>
      {attendee.email && (
        <p className="mt-1 pl-1 text-[11px] text-[var(--cf-text-muted)]">
          {attendee.email}
        </p>
      )}

      {open && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] shadow-xl overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.email}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s)}
              className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-white/5"
            >
              <span className="text-sm font-medium">{s.name}</span>
              <span className="text-xs text-[var(--cf-text-muted)]">{s.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function isoToLocalInput(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function MeetingScheduler({
  initialTitle,
  initialDescription = '',
  initialLocation = '',
  initialStartTime,
  initialEndTime,
  initialAttendees = [],
  initialProvider,
  availableProviders,
  onSuccess,
  onClose,
}: MeetingSchedulerProps) {
  const defaultProvider: Provider = availableProviders[initialProvider]
    ? initialProvider
    : availableProviders.teams
      ? 'teams'
      : 'google'

  const [provider, setProvider] = useState<Provider>(defaultProvider)
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [location, setLocation] = useState(initialLocation)
  const [isOnline, setIsOnline] = useState(true)
  const [start, setStart] = useState(isoToLocalInput(initialStartTime))
  const [end, setEnd] = useState(isoToLocalInput(initialEndTime))
  const [attendees, setAttendees] = useState<MeetingAttendee[]>(
    initialAttendees.length ? initialAttendees : [],
  )
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ meetingUrl: string | null; provider: string } | null>(null)
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const providerOptions = useMemo(
    () =>
      [
        { id: 'teams' as Provider, label: 'Teams', available: availableProviders.teams },
        { id: 'google' as Provider, label: 'Google Calendar', available: availableProviders.google },
      ].filter((o) => o.available),
    [availableProviders],
  )

  const updateAttendee = (index: number, patch: Partial<MeetingAttendee>) => {
    setAttendees((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)))
  }

  const handleCreate = async () => {
    if (!title.trim()) return setError('Meeting title is required')
    if (!start || !end) return setError('Start and end time are required')

    if (new Date(end) <= new Date(start)) {
      return setError('End time must be after start time')
    }
    const startUtc = new Date(start).toISOString()
    const endUtc = new Date(end).toISOString()

    const validAttendees = attendees
      .filter((a) => a.email && a.email.trim())
      .map((a) => ({ name: a.name || a.email!, email: a.email!.trim() }))

    setIsCreating(true)
    setError(null)
    try {
      const response = await fetch('/api/ai/create-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          startTime: start,
          endTime: end,
          startTimeUtc: startUtc,
          endTimeUtc: endUtc,
          timeZone: userTimeZone,
          isOnline,
          attendees: validAttendees,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create meeting')
      }

      setResult({ meetingUrl: data.meetingUrl ?? null, provider: data.provider })
      onSuccess?.({ meetingUrl: data.meetingUrl ?? null, provider: data.provider })
    } catch (err: any) {
      setError(err.message || 'Failed to create meeting. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl glass-strong border-2 border-green-500/30 overflow-hidden shadow-2xl shadow-green-500/20">
        <div className="px-5 py-4 flex items-start gap-3">
          <div className="rounded-lg bg-green-500/15 p-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold">Meeting scheduled</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {provider === 'teams' ? 'Microsoft Teams' : 'Google Calendar'} · invitations sent
            </p>
            {result.meetingUrl && (
              <a
                href={result.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-[rgba(var(--cf-accent-rgb),1)] hover:underline"
              >
                <Video className="h-3.5 w-3.5" />
                Join link
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl glass-strong border-2 border-cyan-500/30 overflow-hidden shadow-2xl shadow-cyan-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="px-5 py-3 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-b border-white/20 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-500 animate-pulse" />
            <h3 className="text-sm font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Schedule Meeting
            </h3>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
              AI ASSISTED
            </Badge>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 hover:bg-white/10">
              <X className="h-3.5 w-3.5 text-slate-400" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Calendar choice */}
        <div>
          <Label className="text-xs font-semibold mb-2 block">Calendar</Label>
          {providerOptions.length === 0 ? (
            <p className="text-xs text-amber-600">
              No calendar connected. Connect Google or Microsoft in Settings.
            </p>
          ) : (
            <div className="flex gap-2">
              {providerOptions.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setProvider(o.id)}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                    provider === o.id
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                      : 'border-[var(--cf-border)] text-[var(--cf-text-muted)] hover:bg-white/5',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label className="text-xs font-semibold mb-2 block">Title *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meeting subject"
            className="h-9 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-semibold mb-2 block">Starts *</Label>
            <Input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold mb-2 block">Ends *</Label>
            <Input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Attendees */}
        <div>
          <Label className="text-xs font-semibold mb-2 block">Attendees</Label>
          <div className="space-y-2">
            {attendees.map((a, i) => (
              <AttendeeRow
                key={i}
                attendee={a}
                onChange={(patch) => updateAttendee(i, patch)}
                onRemove={() => setAttendees((prev) => prev.filter((_, idx) => idx !== i))}
              />
            ))}
            {attendees.some((a) => !a.email && a.name) && (
              <p className="text-[11px] text-amber-600">
                Highlighted attendees have no email yet — start typing their name to search your directory.
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setAttendees((prev) => [...prev, { name: '', email: '', matched: false }])}
            >
              <Plus className="h-3.5 w-3.5" />
              Add attendee
            </Button>
          </div>
        </div>

        {/* Online toggle */}
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isOnline}
            onChange={(e) => setIsOnline(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <Video className="h-3.5 w-3.5 text-cyan-500" />
          <span>
            Add {provider === 'teams' ? 'Teams' : 'Google Meet'} online meeting link
          </span>
        </label>

        {!isOnline && (
          <div>
            <Label className="text-xs font-semibold mb-2 block">Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Office, room, address…"
              className="h-9 text-sm"
            />
          </div>
        )}

        <div>
          <Label className="text-xs font-semibold mb-2 block">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agenda or notes (optional)"
            rows={3}
            className="resize-none text-sm"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-white/5 border-t border-white/20 dark:border-white/10 flex items-center gap-2">
        <Button
          onClick={handleCreate}
          disabled={isCreating || !title.trim() || providerOptions.length === 0}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 shadow-lg h-9 text-sm"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              Scheduling…
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
              Schedule Meeting
            </>
          )}
        </Button>
        {onClose && (
          <Button onClick={onClose} variant="outline" className="h-9 px-4 text-sm">
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
