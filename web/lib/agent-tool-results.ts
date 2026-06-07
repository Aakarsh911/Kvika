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
  message: string | null
} {
  let clientAction: AgentClientAction | null = null
  let message: string | null = null

  for (const trace of traces) {
    for (const payload of collectTracePayloads(trace)) {
      const mapped = mapToolPayloadToClientAction(payload)
      if (mapped) {
        clientAction = mapped.action
        message = mapped.message
      }
    }
  }

  return { clientAction, message }
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
      typeof payload.to === "string" &&
      typeof payload.subject === "string" &&
      typeof payload.body === "string"
    ) {
      return {
        action: {
          type: "show_new_email_draft",
          to: payload.to,
          subject: payload.subject,
          body: payload.body,
          provider: payload.provider === "outlook" ? "outlook" : "gmail",
        },
        message: `I've drafted an email to ${payload.to}:`,
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

  return null
}
