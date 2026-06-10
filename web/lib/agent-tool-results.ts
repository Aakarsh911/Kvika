import type { AgentClientAction } from "@/lib/bedrock-agent"
import { mapToolPayloadToClientAction } from "@/lib/agent-tool-mappers"

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

  if (typeof raw.text === "string") {
    return parseJsonLoose(raw.text)
  }

  return null
}

/** Stable id for a tool payload so duplicate trace nodes don't render twice. */
export function toolResultFingerprint(payload: Record<string, unknown>): string {
  if (payload.code === "MISSING_EMAIL") return "MISSING_EMAIL"

  const action = payload.action
  if (typeof action !== "string") {
    return JSON.stringify(payload)
  }

  switch (action) {
    case "show_new_email_draft":
      return `${action}|${payload.to}|${payload.subject}|${String(payload.body ?? "").slice(0, 200)}`
    case "show_email_reply_draft":
      return `${action}|${payload.emailId}|${payload.subject}|${String(payload.body ?? "").slice(0, 200)}`
    case "show_jira_ticket_draft":
      return `${action}|${payload.title}|${payload.description}`
    case "show_meeting_scheduler":
      return `${action}|${payload.title}|${payload.startTime}|${payload.endTime}|${JSON.stringify(payload.attendees ?? [])}`
    default:
      return `${action}|${JSON.stringify(payload)}`
  }
}

function pushUniquePayload(
  payload: Record<string, unknown>,
  payloads: Record<string, unknown>[],
  seenFingerprints: Set<string>,
) {
  const fingerprint = toolResultFingerprint(payload)
  if (seenFingerprints.has(fingerprint)) return
  seenFingerprints.add(fingerprint)
  payloads.push(payload)
}

function pushUniqueInvocationText(
  text: string,
  payloads: Record<string, unknown>[],
  seenInvocationText: Set<string>,
  seenFingerprints: Set<string>,
) {
  const normalized = text.trim()
  if (!normalized || seenInvocationText.has(normalized)) return
  seenInvocationText.add(normalized)

  const parsed = parseJsonLoose(normalized)
  const unwrapped = parsed ? unwrapToolPayload(parsed) : null
  if (unwrapped) pushUniquePayload(unwrapped, payloads, seenFingerprints)
}

function collectTracePayloads(
  trace: unknown,
  seenInvocationText: Set<string>,
  seenFingerprints: Set<string>,
): Record<string, unknown>[] {
  const payloads: Record<string, unknown>[] = []
  const seenNodes = new Set<object>()

  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return
    if (seenNodes.has(node)) return
    seenNodes.add(node)

    const obj = node as Record<string, unknown>

    const invocationOutput = obj.actionGroupInvocationOutput as { text?: string } | undefined
    if (invocationOutput?.text) {
      pushUniqueInvocationText(invocationOutput.text, payloads, seenInvocationText, seenFingerprints)
    }

    const responseBody = obj.responseBody as Record<string, unknown> | undefined
    const jsonBody = responseBody?.["application/json"] as { body?: string } | undefined
    if (jsonBody?.body) {
      const parsed = parseJsonLoose(jsonBody.body)
      const unwrapped = parsed ? unwrapToolPayload(parsed) : null
      if (unwrapped) pushUniquePayload(unwrapped, payloads, seenFingerprints)
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
  const clientActions: AgentClientAction[] = []
  const messages: string[] = []
  const seenInvocationText = new Set<string>()
  const seenFingerprints = new Set<string>()

  for (const trace of traces) {
    for (const payload of collectTracePayloads(trace, seenInvocationText, seenFingerprints)) {
      const mapped = mapToolPayloadToClientAction(payload)
      if (!mapped) continue
      clientActions.push(mapped.action)
      messages.push(mapped.message)
    }
  }

  const clientAction = clientActions[clientActions.length - 1] ?? null
  const message =
    messages.length > 1 ? messages.join(" ") : messages[messages.length - 1] ?? null

  return { clientAction, clientActions, message, messages }
}
