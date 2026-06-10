"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type PersonSuggestion = { name: string; email: string }

const EMAIL_IN_TEXT = /<([^>]+)>|([^\s<>]+@[^\s<>]+\.[^\s<>]+)/

function cleanRecipientText(text: string): string {
  let value = text.trim()
  value = value.replace(/^\[\s*/, "").replace(/\s*\]$/, "")
  value = value.replace(/^['"]|['"]$/g, "").trim()
  return value
}

function parseRecipientText(text: string): { name: string; email: string | null } {
  const trimmed = cleanRecipientText(text)
  const match = trimmed.match(EMAIL_IN_TEXT)
  const email = match ? match[1] || match[2] : null
  const name = email ? trimmed.replace(/<[^>]*>/, "").trim() || email : trimmed
  return { name, email }
}

export type PersonRecipientValue = {
  name: string
  email: string | null
  matched: boolean
}

type PersonRecipientInputProps = {
  value: PersonRecipientValue
  onChange: (value: PersonRecipientValue) => void
  placeholder?: string
  className?: string
  inputClassName?: string
}

export function PersonRecipientInput({
  value,
  onChange,
  placeholder = "Type a name or email…",
  className,
  inputClassName,
}: PersonRecipientInputProps) {
  const initial =
    value.name && value.email && value.name !== value.email ? value.name : value.email || value.name || ""
  const [text, setText] = useState(cleanRecipientText(initial))
  const [suggestions, setSuggestions] = useState<PersonSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const justPicked = useRef(false)

  useEffect(() => {
    const display =
      value.name && value.email && value.name !== value.email ? value.name : value.email || value.name || ""
    setText(cleanRecipientText(display))
  }, [value.name, value.email])

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

  const commit = (nextText: string) => {
    const parsed = parseRecipientText(nextText)
    onChange({
      name: parsed.name,
      email: parsed.email,
      matched: !!parsed.email,
    })
  }

  const pick = (suggestion: PersonSuggestion) => {
    justPicked.current = true
    setText(suggestion.name)
    setOpen(false)
    setSuggestions([])
    onChange({ name: suggestion.name, email: suggestion.email, matched: true })
  }

  const unresolved = !value.email

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--cf-text-muted)]" />
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            commit(e.target.value)
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className={cn(
            "h-7 pl-7 text-xs",
            unresolved && text.trim() && "border-amber-500/60",
            inputClassName,
          )}
        />
        {loading && (
          <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-[var(--cf-text-muted)]" />
        )}
      </div>
      {value.email && (
        <p className="mt-1 pl-1 text-[11px] text-[var(--cf-text-muted)]">{value.email}</p>
      )}
      {open && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[var(--cf-border)] bg-[var(--cf-bg)] shadow-xl">
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
