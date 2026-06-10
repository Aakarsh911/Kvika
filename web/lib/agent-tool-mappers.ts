import type { AgentClientAction } from "@/lib/bedrock-agent"

export type ToolPayloadMapping = {
  action: AgentClientAction
  message: string
}

export type ToolPayloadMapper = (payload: Record<string, unknown>) => ToolPayloadMapping | null

/**
 * Map a Lambda / internal API JSON payload to a UI client action.
 *
 * To add a new tool:
 * 1. Extend `AgentClientAction` in `bedrock-agent.ts`
 * 2. Return `{ action: "show_…", … }` from the internal route / Lambda
 * 3. Add a mapper here and register it in `toolPayloadMappers`
 * 4. Handle the type in `ai-chat-drawer.tsx` → `buildAgentClientActionMessage`
 */
export const toolPayloadMappers: ToolPayloadMapper[] = [
  mapMissingEmailPayload,
  mapNewEmailDraftPayload,
  mapReplyDraftPayload,
  mapJiraDraftPayload,
  mapMeetingSchedulerPayload,
]

export function mapToolPayloadToClientAction(
  payload: Record<string, unknown>,
): ToolPayloadMapping | null {
  for (const mapper of toolPayloadMappers) {
    const mapped = mapper(payload)
    if (mapped) return mapped
  }
  return null
}

function mapMissingEmailPayload(payload: Record<string, unknown>): ToolPayloadMapping | null {
  if (payload.code !== "MISSING_EMAIL") return null
  return {
    action: { type: "show_email_selector" },
    message:
      typeof payload.message === "string"
        ? payload.message
        : "Please select an email to reply to.",
  }
}

function mapNewEmailDraftPayload(payload: Record<string, unknown>): ToolPayloadMapping | null {
  if (payload.action !== "show_new_email_draft") return null
  if (typeof payload.subject !== "string" || typeof payload.body !== "string") return null

  const to = typeof payload.to === "string" ? payload.to : ""
  const toName = typeof payload.toName === "string" ? payload.toName : to
  const recipientMatched = payload.recipientMatched === true
  const displayName = toName || to || "your recipient"

  return {
    action: {
      type: "show_new_email_draft",
      to,
      toName,
      recipientMatched,
      subject: payload.subject,
      body: payload.body,
      provider: payload.provider === "outlook" ? "outlook" : "gmail",
    },
    message: recipientMatched
      ? `I've drafted an email to ${displayName}:`
      : `I've drafted the email. Pick ${displayName} from suggestions to confirm their address:`,
  }
}

function mapReplyDraftPayload(payload: Record<string, unknown>): ToolPayloadMapping | null {
  if (payload.action !== "show_email_reply_draft") return null
  if (
    typeof payload.emailId !== "string" ||
    (payload.provider !== "gmail" && payload.provider !== "outlook") ||
    typeof payload.subject !== "string" ||
    typeof payload.body !== "string"
  ) {
    return null
  }

  return {
    action: {
      type: "show_email_reply_draft",
      emailId: payload.emailId,
      provider: payload.provider,
      subject: payload.subject,
      body: payload.body,
    },
    message: `I've drafted a reply to "${payload.subject}":`,
  }
}

function mapJiraDraftPayload(payload: Record<string, unknown>): ToolPayloadMapping | null {
  if (payload.action !== "show_jira_ticket_draft") return null
  if (typeof payload.title !== "string" || typeof payload.description !== "string") return null

  return {
    action: {
      type: "show_jira_ticket_draft",
      title: payload.title,
      description: payload.description,
      priority:
        payload.priority === "High" || payload.priority === "Low" ? payload.priority : "Medium",
    },
    message: "I'll help you create a Jira ticket. Please review and edit the details:",
  }
}

function mapMeetingSchedulerPayload(payload: Record<string, unknown>): ToolPayloadMapping | null {
  if (payload.action !== "show_meeting_scheduler") return null
  if (
    typeof payload.title !== "string" ||
    typeof payload.startTime !== "string" ||
    typeof payload.endTime !== "string"
  ) {
    return null
  }

  const rawAttendees = Array.isArray(payload.attendees) ? payload.attendees : []
  const attendees = rawAttendees
    .map((a) => a as Record<string, unknown>)
    .map((a) => ({
      name: typeof a.name === "string" ? a.name : "",
      email: typeof a.email === "string" ? a.email : null,
      matched: a.matched === true,
    }))

  const availRaw = (payload.availableProviders as Record<string, unknown>) || {}
  const unresolved = attendees.filter((a) => !a.matched).map((a) => a.name)

  return {
    action: {
      type: "show_meeting_scheduler",
      title: payload.title,
      description: typeof payload.description === "string" ? payload.description : "",
      location: typeof payload.location === "string" ? payload.location : "",
      startTime: payload.startTime,
      endTime: payload.endTime,
      attendees,
      provider: payload.provider === "google" ? "google" : "teams",
      availableProviders: {
        google: availRaw.google === true,
        teams: availRaw.teams === true,
      },
    },
    message:
      unresolved.length > 0
        ? `I've prepared your meeting. I couldn't find an email for ${unresolved.join(", ")} — add it below, then pick a calendar and confirm.`
        : "I've prepared your meeting. Review the details, pick a calendar, and confirm.",
  }
}
