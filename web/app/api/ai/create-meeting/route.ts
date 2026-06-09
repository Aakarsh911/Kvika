import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z, ZodError } from "zod"
import { google } from "googleapis"
import { Client } from "@microsoft/microsoft-graph-client"
import { Provider } from "@prisma/client"
import "isomorphic-fetch"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

const MICROSOFT_SCOPE =
  "openid email profile offline_access User.Read Calendars.ReadWrite Calendars.ReadWrite.Shared OnlineMeetings.ReadWrite Mail.Send"

const createMeetingSchema = z.object({
  provider: z.enum(["google", "teams"]),
  title: z.string().min(1).max(255),
  description: z.string().max(8000).optional(),
  location: z.string().max(500).optional(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  startTimeUtc: z.string().optional(),
  endTimeUtc: z.string().optional(),
  timeZone: z.string().min(1).optional(),
  isOnline: z.boolean().optional(),
  attendees: z
    .array(
      z.object({
        name: z.string().optional(),
        email: z.string().email(),
      }),
    )
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const input = createMeetingSchema.parse(await request.json())
    const attendees = (input.attendees || []).filter((a) => a.email)

    if (input.provider === "teams") {
      return await createTeamsMeeting(session.user.email, input, attendees)
    }
    return await createGoogleMeeting(session.user.email, input, attendees)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid meeting request", details: error.flatten() },
        { status: 400 },
      )
    }
    console.error("Create meeting error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

type MeetingInput = z.infer<typeof createMeetingSchema>
type Attendee = { name?: string; email: string }

function toProviderDateTime(value: string) {
  // datetime-local inputs intentionally omit an offset; Graph/Google pair them
  // with the explicit timeZone field so the user's wall-clock time is preserved.
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) {
    return value.length === 16 ? `${value}:00` : value
  }
  return new Date(value).toISOString()
}

async function createTeamsMeeting(userEmail: string, input: MeetingInput, attendees: Attendee[]) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { integrations: { where: { provider: Provider.MICROSOFT } } },
  })

  const integration = user?.integrations?.[0]
  if (!integration?.accessToken) {
    return NextResponse.json({ error: "Microsoft account not connected" }, { status: 400 })
  }

  let accessToken = integration.accessToken
  if (integration.expiresAt && new Date() >= integration.expiresAt && integration.refreshToken) {
    const resp = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AZURE_AD_CLIENT_ID || "",
        client_secret: process.env.AZURE_AD_CLIENT_SECRET || "",
        refresh_token: integration.refreshToken,
        grant_type: "refresh_token",
        scope: MICROSOFT_SCOPE,
      }),
    })
    if (resp.ok) {
      const data = await resp.json()
      accessToken = data.access_token
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || integration.refreshToken,
          expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
        },
      })
    }
  }

  const client = Client.init({ authProvider: (done) => done(null, accessToken as string) })
  const isOnline = input.isOnline !== false

  const eventPayload: Record<string, unknown> = {
    subject: input.title,
    body: { contentType: "HTML", content: input.description || "" },
    start: { dateTime: toProviderDateTime(input.startTime), timeZone: input.timeZone || "UTC" },
    end: { dateTime: toProviderDateTime(input.endTime), timeZone: input.timeZone || "UTC" },
    attendees: attendees.map((a) => ({
      emailAddress: { address: a.email, name: a.name || a.email },
      type: "required",
    })),
    isOnlineMeeting: isOnline,
    onlineMeetingProvider: isOnline ? "teamsForBusiness" : undefined,
  }
  if (!isOnline && input.location) {
    eventPayload.location = { displayName: input.location }
  }

  const event = await client
    .api("/me/events")
    .header("Prefer", `outlook.timezone="${input.timeZone || "UTC"}"`)
    .post(eventPayload)

  const meetingUrl = event.onlineMeeting?.joinUrl || event.webLink || null

  await persistCalendarEvent({
    userId: user!.id,
    organizerEmail: userEmail,
    input,
    attendees,
    source: "MICROSOFT",
    sourceId: event.id,
    meetingUrl,
  })

  return NextResponse.json({
    success: true,
    provider: "teams",
    meetingUrl,
    eventId: event.id,
    message: `Meeting created and invitations sent to ${event.attendees?.length || 0} attendee(s).`,
  })
}

async function createGoogleMeeting(userEmail: string, input: MeetingInput, attendees: Attendee[]) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { integrations: { where: { provider: Provider.GOOGLE } } },
  })

  const googleIntegration = user?.integrations?.[0]
  const accessToken = googleIntegration?.accessToken || user?.accessToken
  const refreshToken = googleIntegration?.refreshToken || user?.refreshToken

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ error: "Google account not connected" }, { status: 400 })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  )
  oauth2Client.setCredentials({
    access_token: accessToken || undefined,
    refresh_token: refreshToken || undefined,
  })

  const calendar = google.calendar({ version: "v3", auth: oauth2Client })
  const isOnline = input.isOnline !== false

  const requestBody: Record<string, unknown> = {
    summary: input.title,
    description: input.description || undefined,
    location: !isOnline ? input.location || undefined : undefined,
    start: { dateTime: toProviderDateTime(input.startTime), timeZone: input.timeZone || "UTC" },
    end: { dateTime: toProviderDateTime(input.endTime), timeZone: input.timeZone || "UTC" },
    attendees: attendees.map((a) => ({ email: a.email, displayName: a.name })),
  }

  if (isOnline) {
    requestBody.conferenceData = {
      createRequest: {
        requestId: `chronoflow-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    }
  }

  const response = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: isOnline ? 1 : 0,
    sendUpdates: "all",
    requestBody,
  })

  const meetingUrl = response.data.hangoutLink || response.data.htmlLink || null

  if (user) {
    await persistCalendarEvent({
      userId: user.id,
      organizerEmail: userEmail,
      input,
      attendees,
      source: "GOOGLE",
      sourceId: response.data.id || undefined,
      meetingUrl,
    })
  }

  return NextResponse.json({
    success: true,
    provider: "google",
    meetingUrl,
    eventId: response.data.id,
    message: `Meeting created on Google Calendar with ${attendees.length} attendee(s).`,
  })
}

async function persistCalendarEvent(params: {
  userId: string
  organizerEmail: string
  input: MeetingInput
  attendees: Attendee[]
  source: "GOOGLE" | "MICROSOFT"
  sourceId?: string
  meetingUrl: string | null
}) {
  try {
    await prisma.calendarEvent.create({
      data: {
        userId: params.userId,
        title: params.input.title,
        description: params.input.description || null,
        startTime: new Date(params.input.startTimeUtc || params.input.startTime),
        endTime: new Date(params.input.endTimeUtc || params.input.endTime),
        location: params.input.location || null,
        timeZone: params.input.timeZone || "UTC",
        attendees: params.attendees.map((a) => ({
          email: a.email,
          name: a.name || a.email,
          responseStatus: "needsAction",
        })),
        organizerEmail: params.organizerEmail,
        meetingUrl: params.meetingUrl,
        eventType: "MEETING",
        isManaged: true,
        source: params.source,
        sourceId: params.sourceId || null,
        syncStatus: "SYNCED",
      },
    })
  } catch (error) {
    // Don't fail the request if local mirroring fails — the meeting was created.
    console.error("Failed to mirror meeting into ChronoFlow calendar:", error)
  }
}
