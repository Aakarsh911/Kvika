import type { AgentClientAction } from "@/lib/bedrock-agent"

function parseJsonLoose(value: string): Record<string, unknown> | null {
  const trimmed = value.trim()
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    // fall through
  }

  const match = trimmed.match(/\{[\s\S]*\}/)
  if (!match) return null

  try {
    return JSON.parse(match[0]) as Record<string, unknown>
  } catch {
    return null
  }
}

function unwrapToolPayload(raw: Record<string, unknown>): Record<string, unknown> | null {
  if (typeof raw.action === "string") {
    return raw
  }

  if (raw.code === "MISSING_EMAIL") {
    return raw
  }

  const response = raw.response as Record<string, unknown> | undefined
  const responseBody = response?.responseBody as Record<string, unknown> | undefined
  const jsonBody = responseBody?.["application/json"] as { body?: string } | undefined
  if (jsonBody?.body) {
    return parseJsonLoose(jsonBody.body)
  }

  if (typeof raw.body === "string") {
    return parseJsonLoose(raw.body)
  }

  return null
}

function collectTracePayloads(trace: unknown): Record<string, unknown>[] {
  const payloads: Record<string, unknown>[] = []
  const seen = new Set<object>()

  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return
    if (seen.has(node)) return
    seen.add(node)

    const obj = node as Record<string, unknown>

    const invocationOutput = obj.actionGroupInvocationOutput as { text?: string } | undefined
    if (invocationOutput?.text) {
      const parsed = parseJsonLoose(invocationOutput.text)
      const unwrapped = parsed ? unwrapToolPayload(parsed) : null
      if (unwrapped) payloads.push(unwrapped)
    }

    const responseBody = obj.responseBody as Record<string, unknown> | undefined
    const jsonBody = responseBody?.["application/json"] as { body?: string } | undefined
    if (jsonBody?.body) {
      const parsed = parseJsonLoose(jsonBody.body)
      const unwrapped = parsed ? unwrapToolPayload(parsed) : null
      if (unwrapped) payloads.push(unwrapped)
    }

    for (const value of Object.values(obj)) {
      if (value && typeof value === "object") {
        walk(value)
      }
    }
  }

  walk(trace)
  return payloads
}

export function extractToolResultsFromTrace(traces: unknown[]): {
  clientAction: AgentClientAction | null
  clientActions: AgentClientAction[]
  message: string | null
  messages: string[]
} {
  let clientAction: AgentClientAction | null = null
  let message: string | null = null
  const clientActions: AgentClientAction[] = []
  const messages: string[] = []
  const seen = new Set<string>()

  for (const trace of traces) {
    for (const payload of collectTracePayloads(trace)) {
      const mapped = mapToolPayloadToClientAction(payload)
      if (mapped) {
        const key = JSON.stringify(mapped.action)
        if (seen.has(key)) continue
        seen.add(key)
        clientActions.push(mapped.action)
        messages.push(mapped.message)
        clientAction = mapped.action
        message = mapped.message
      }
    }
  }

  return { clientAction, clientActions, message, messages }
}

function mapToolPayloadToClientAction(payload: Record<string, unknown>): {
  action: AgentClientAction
  message: string
} | null {
  if (payload.code === "MISSING_EMAIL") {
    return {
      action: { type: "show_email_selector" },
      message:
        typeof payload.message === "string"
          ? payload.message
          : "Please select an email to reply to.",
    }
  }

  const action = payload.action
  if (action === "show_new_email_draft") {
    if (
      typeof payload.subject === "string" &&
      typeof payload.body === "string"
    ) {
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
  }

  if (action === "show_email_reply_draft") {
    if (
      typeof payload.emailId === "string" &&
      (payload.provider === "gmail" || payload.provider === "outlook") &&
      typeof payload.subject === "string" &&
      typeof payload.body === "string"
    ) {
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
  }

  if (action === "show_jira_ticket_draft") {
    if (typeof payload.title === "string" && typeof payload.description === "string") {
      return {
        action: {
          type: "show_jira_ticket_draft",
          title: payload.title,
          description: payload.description,
          priority:
            payload.priority === "High" || payload.priority === "Low"
              ? payload.priority
              : "Medium",
        },
        message: "I'll help you create a Jira ticket. Please review and edit the details:",
      }
    }
  }

  if (action === "show_meeting_scheduler") {
    if (
      typeof payload.title === "string" &&
      typeof payload.startTime === "string" &&
      typeof payload.endTime === "string"
    ) {
      const rawAttendees = Array.isArray(payload.attendees) ? payload.attendees : []
      const attendees = rawAttendees
        .map((a) => a as Record<string, unknown>)
        .map((a) => ({
          name: typeof a.name === "string" ? a.name : "",
          email: typeof a.email === "string" ? a.email : null,
          matched: a.matched === true,
        }))

      const availRaw = (payload.availableProviders as Record<string, unknown>) || {}
      const provider = payload.provider === "google" ? "google" : "teams"

      const unresolved = attendees.filter((a) => !a.matched).map((a) => a.name)
      const message = unresolved.length
        ? `I've prepared your meeting. I couldn't find an email for ${unresolved.join(", ")} — add it below, then pick a calendar and confirm.`
        : "I've prepared your meeting. Review the details, pick a calendar, and confirm."

      return {
        action: {
          type: "show_meeting_scheduler",
          title: payload.title,
          description: typeof payload.description === "string" ? payload.description : "",
          location: typeof payload.location === "string" ? payload.location : "",
          startTime: payload.startTime,
          endTime: payload.endTime,
          attendees,
          provider,
          availableProviders: {
            google: availRaw.google === true,
            teams: availRaw.teams === true,
          },
        },
        message,
      }
    }
  }

  return null
}
