import { z } from "zod"
import { Provider } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { resolveAttendees, type ResolvedAttendee } from "@/lib/teams-directory"

export const prepareMeetingInputSchema = z.object({
  userEmail: z.string().email(),
  title: z.string().min(1).max(255),
  startTime: z.string().min(1),
  durationMinutes: z.coerce.number().int().positive().max(24 * 60).optional(),
  attendees: z.array(z.string()).optional(),
  description: z.string().max(8000).optional(),
  location: z.string().max(500).optional(),
})

export type PrepareMeetingInput = z.infer<typeof prepareMeetingInputSchema>

export type MeetingDraftAttendee = {
  name: string
  email: string | null
  matched: boolean
}

export type MeetingDraft = {
  action: "show_meeting_scheduler"
  title: string
  description: string
  location: string
  startTime: string
  endTime: string
  durationMinutes: number
  attendees: MeetingDraftAttendee[]
  unresolvedAttendees: string[]
  provider: "google" | "teams"
  availableProviders: { google: boolean; teams: boolean }
}

function normalizeStartTime(raw: string): Date {
  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return parsed
  // Fall back to "now + 1h" rounded if the model handed us something unparseable.
  const fallback = new Date(Date.now() + 60 * 60 * 1000)
  fallback.setMinutes(0, 0, 0)
  return fallback
}

const EXPLICIT_TIME_ZONE = /[zZ]|[+-]\d{2}:?\d{2}$/
const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/

function normalizeLocalDateTime(raw: string): string | null {
  const value = raw.trim()
  if (EXPLICIT_TIME_ZONE.test(value)) return null

  const match = value.match(LOCAL_DATE_TIME)
  if (!match) return null

  const [, year, month, day, hour, minute, second] = match
  return `${year}-${month}-${day}T${hour}:${minute}${second ? `:${second}` : ""}`
}

function addMinutesToLocalDateTime(value: string, minutes: number): string {
  const match = value.match(LOCAL_DATE_TIME)
  if (!match) return new Date(new Date(value).getTime() + minutes * 60 * 1000).toISOString()

  const [, year, month, day, hour, minute, second] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second || 0))
  date.setUTCMinutes(date.getUTCMinutes() + minutes)

  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
}

function normalizeAttendeeText(raw: string): string {
  let value = raw.trim()

  // Models sometimes pass a single attendee as a list-looking string, e.g. "[aakarsh]".
  value = value.replace(/^\[\s*/, "").replace(/\s*\]$/, "")
  value = value.replace(/^['"]|['"]$/g, "").trim()

  return value
}

async function getAvailableProviders(userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { integrations: true },
  })

  const hasGoogle =
    !!user?.googleId || !!user?.integrations.some((i) => i.provider === Provider.GOOGLE)
  const hasMicrosoft = !!user?.integrations.some((i) => i.provider === Provider.MICROSOFT)

  return { google: hasGoogle, teams: hasMicrosoft }
}

export async function buildMeetingDraft(input: PrepareMeetingInput): Promise<MeetingDraft> {
  const parsed = prepareMeetingInputSchema.parse(input)

  const durationMinutes = parsed.durationMinutes ?? 30
  const localStartTime = normalizeLocalDateTime(parsed.startTime)
  let startTime: string
  let endTime: string

  if (localStartTime) {
    startTime = localStartTime
    endTime = addMinutesToLocalDateTime(localStartTime, durationMinutes)
  } else {
    const start = normalizeStartTime(parsed.startTime)
    startTime = start.toISOString()
    endTime = new Date(start.getTime() + durationMinutes * 60 * 1000).toISOString()
  }
  const attendees = parsed.attendees?.map(normalizeAttendeeText).filter(Boolean) ?? []

  const resolved: ResolvedAttendee[] = attendees.length
    ? await resolveAttendees(parsed.userEmail, attendees)
    : []

  const availableProviders = await getAvailableProviders(parsed.userEmail)
  const provider: "google" | "teams" = availableProviders.teams ? "teams" : "google"

  return {
    action: "show_meeting_scheduler",
    title: parsed.title.trim(),
    description: parsed.description?.trim() || "",
    location: parsed.location?.trim() || "",
    startTime,
    endTime,
    durationMinutes,
    attendees: resolved.map((a) => ({ name: a.name, email: a.email, matched: a.matched })),
    unresolvedAttendees: resolved.filter((a) => !a.matched).map((a) => a.query),
    provider,
    availableProviders,
  }
}
