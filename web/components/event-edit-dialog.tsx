"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Calendar, Clock, Loader2, MapPin, FileText, Zap, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type EditableCalendarEvent = {
  id: string
  title: string
  summary?: string
  description?: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end: { dateTime?: string; date?: string; timeZone?: string }
  location?: string
  source: string
  eventType: string
  isManaged: boolean
  modifiedLocally?: boolean
}

interface EventEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: EditableCalendarEvent | null
  onEventUpdated?: () => void
}

function parseEventTimes(event: EditableCalendarEvent) {
  const startIso = event.start.dateTime || event.start.date
  const endIso = event.end.dateTime || event.end.date
  if (!startIso || !endIso) return null

  const start = new Date(startIso)
  const end = new Date(endIso)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null

  return { start, end, isAllDay: !event.start.dateTime }
}

export function EventEditDialog({
  open,
  onOpenChange,
  event,
  onEventUpdated,
}: EventEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [dateValue, setDateValue] = useState("")
  const [startTimeValue, setStartTimeValue] = useState("")
  const [endTimeValue, setEndTimeValue] = useState("")

  useEffect(() => {
    if (!open || !event) return

    const times = parseEventTimes(event)
    setTitle(event.title || event.summary || "")
    setDescription(event.description || "")
    setLocation(event.location || "")
    setError(null)

    if (times && !times.isAllDay) {
      setDateValue(format(times.start, "yyyy-MM-dd"))
      setStartTimeValue(format(times.start, "HH:mm"))
      setEndTimeValue(format(times.end, "HH:mm"))
    } else {
      setDateValue("")
      setStartTimeValue("")
      setEndTimeValue("")
    }
  }, [open, event])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return

    if (!event.isManaged) {
      setError("This event cannot be rescheduled in Kvika.")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const [year, month, day] = dateValue.split("-").map(Number)
      const [startHour, startMinute] = startTimeValue.split(":").map(Number)
      const [endHour, endMinute] = endTimeValue.split(":").map(Number)

      const eventStart = new Date(year, month - 1, day, startHour, startMinute, 0, 0)
      const eventEnd = new Date(year, month - 1, day, endHour, endMinute, 0, 0)

      if (eventEnd <= eventStart) {
        throw new Error("End time must be after start time")
      }

      const response = await fetch(`/api/calendar/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          startTime: eventStart.toISOString(),
          endTime: eventEnd.toISOString(),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to update event")
      }

      const source = event.source.toLowerCase()
      if (source === "google" || source === "microsoft") {
        const syncResponse = await fetch("/api/calendar/sync-push", { method: "POST" })
        if (!syncResponse.ok) {
          const syncData = await syncResponse.json().catch(() => ({}))
          throw new Error(
            syncData.error || "Event updated locally, but calendar sync failed. Try refreshing.",
          )
        }
      }

      onOpenChange(false)
      onEventUpdated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event")
    } finally {
      setLoading(false)
    }
  }

  const isReadOnly = !event?.isManaged
  const times = event ? parseEventTimes(event) : null
  const isAllDay = times?.isAllDay ?? false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {isReadOnly ? "Event Details" : "Reschedule Event"}
          </DialogTitle>
        </DialogHeader>

        {isReadOnly ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p>
                This event has external attendees or is marked non-manageable. Move it in Google
                Calendar or Outlook instead.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">{event?.title || event?.summary}</p>
              {times && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {isAllDay
                    ? format(times.start, "EEEE, MMMM d, yyyy")
                    : `${format(times.start, "EEEE, MMMM d, yyyy")} · ${format(times.start, "h:mm a")} - ${format(times.end, "h:mm a")}`}
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
              <Zap className="h-4 w-4 text-blue-500" />
              <span>Kvika can move this event and sync the change to your calendar.</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Date & Time
              </Label>
              <Input
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                required
                disabled={isAllDay}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={startTimeValue}
                  onChange={(e) => setStartTimeValue(e.target.value)}
                  required
                  disabled={isAllDay}
                  className="flex-1"
                />
                <span>to</span>
                <Input
                  type="time"
                  value={endTimeValue}
                  onChange={(e) => setEndTimeValue(e.target.value)}
                  required
                  disabled={isAllDay}
                  className="flex-1"
                />
              </div>
              {isAllDay && (
                <p className="text-xs text-muted-foreground">
                  All-day events cannot be rescheduled from this dialog yet.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="edit-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !title.trim() || isAllDay}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
