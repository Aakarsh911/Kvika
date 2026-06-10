import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
  type InvokeAgentCommandOutput,
} from "@aws-sdk/client-bedrock-agent-runtime"

import { sanitizeAgentText } from "@/lib/agent-text"

function assertEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set in environment variables`)
  }
  return value
}

let client: BedrockAgentRuntimeClient | null = null

export function getBedrockAgentClient() {
  if (client) return client

  const region = assertEnv("AWS_REGION")
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const sessionToken = process.env.AWS_SESSION_TOKEN

  const credentials =
    accessKeyId && secretAccessKey
      ? {
          accessKeyId,
          secretAccessKey,
          ...(sessionToken && !sessionToken.includes("optional") && !sessionToken.includes("your-")
            ? { sessionToken }
            : {}),
        }
      : undefined

  client = new BedrockAgentRuntimeClient({
    region,
    credentials,
  })

  return client
}

export interface BedrockAgentResult {
  text: string
  sessionId: string
  traces: unknown[]
}

export async function invokeChronoFlowAgent(params: {
  inputText: string
  sessionId: string
  sessionAttributes?: Record<string, string>
  promptSessionAttributes?: Record<string, string>
  enableTrace?: boolean
}): Promise<BedrockAgentResult> {
  const agentId = assertEnv("BEDROCK_AGENT_ID")
  const agentAliasId = assertEnv("BEDROCK_AGENT_ALIAS_ID")
  const runtime = getBedrockAgentClient()

  const output: InvokeAgentCommandOutput = await runtime.send(
    new InvokeAgentCommand({
      agentId,
      agentAliasId,
      sessionId: params.sessionId,
      inputText: params.inputText,
      enableTrace: params.enableTrace ?? true,
      sessionState: {
        sessionAttributes: params.sessionAttributes,
        promptSessionAttributes: params.promptSessionAttributes,
      },
    }),
  )

  const decoder = new TextDecoder()
  let text = ""
  const traces: unknown[] = []

  if (output.completion) {
    for await (const event of output.completion) {
      if (event.chunk?.bytes) {
        text += decoder.decode(event.chunk.bytes)
      }
      if (event.trace) {
        traces.push(event.trace)
      }
    }
  }

  return {
    text: sanitizeAgentText(text),
    sessionId: params.sessionId,
    traces,
  }
}

export type AgentClientAction =
  | {
      type: "show_new_email_draft"
      to: string
      toName?: string
      recipientMatched?: boolean
      subject: string
      body: string
      provider?: "gmail" | "outlook"
    }
  | {
      type: "show_email_reply_draft"
      emailId: string
      provider: "gmail" | "outlook"
      subject: string
      body: string
    }
  | {
      type: "show_jira_ticket_draft"
      title: string
      description: string
      priority: string
    }
  | {
      type: "show_meeting_scheduler"
      title: string
      description: string
      location: string
      startTime: string
      endTime: string
      attendees: { name: string; email: string | null; matched: boolean }[]
      provider: "google" | "teams"
      availableProviders: { google: boolean; teams: boolean }
    }
  | {
      type: "show_email_selector"
    }

/** Parse structured JSON the agent may return after a tool call or for UI actions. */
export function extractAgentClientAction(text: string): {
  message: string
  clientAction: AgentClientAction | null
} {
  const cleanedText = sanitizeAgentText(text)
  const parsed = parseJsonFromAgentText(cleanedText)
  const rawAction: any = parsed?.clientAction ?? normalizeLegacyAction(parsed)

  if (!rawAction?.type) {
    return {
      message: cleanedText || "I apologize, but I could not generate a response.",
      clientAction: null,
    }
  }

  switch (rawAction.type) {
    case "show_new_email_draft":
      if (typeof rawAction.subject === "string" && typeof rawAction.body === "string") {
        const to = typeof rawAction.to === "string" ? rawAction.to : ""
        const toName = typeof rawAction.toName === "string" ? rawAction.toName : to
        const displayName = toName || to || "your recipient"
        return {
          message: pickMessage(
            parsed,
            rawAction.recipientMatched
              ? `I've drafted an email to ${displayName}:`
              : `I've drafted the email. Confirm ${displayName}'s address below before sending:`,
          ),
          clientAction: {
            type: "show_new_email_draft",
            to,
            toName,
            recipientMatched: rawAction.recipientMatched === true,
            subject: rawAction.subject,
            body: rawAction.body,
            provider: rawAction.provider === "outlook" ? "outlook" : "gmail",
          },
        }
      }
      break
    case "show_email_reply_draft":
      if (
        typeof rawAction.emailId === "string" &&
        (rawAction.provider === "gmail" || rawAction.provider === "outlook") &&
        typeof rawAction.subject === "string" &&
        typeof rawAction.body === "string"
      ) {
        return {
          message: pickMessage(parsed, `I've drafted a reply to "${rawAction.subject}":`),
          clientAction: {
            type: "show_email_reply_draft",
            emailId: rawAction.emailId,
            provider: rawAction.provider,
            subject: rawAction.subject,
            body: rawAction.body,
          },
        }
      }
      break
    case "show_jira_ticket_draft":
      if (
        typeof rawAction.title === "string" &&
        typeof rawAction.description === "string"
      ) {
        return {
          message: pickMessage(
            parsed,
            "I'll help you create a Jira ticket. Please review and edit the details:",
          ),
          clientAction: {
            type: "show_jira_ticket_draft",
            title: rawAction.title,
            description: rawAction.description,
            priority:
              rawAction.priority === "High" || rawAction.priority === "Low"
                ? rawAction.priority
                : "Medium",
          },
        }
      }
      break
    case "show_email_selector":
      return {
        message: pickMessage(parsed, "Please select an email to reply to."),
        clientAction: { type: "show_email_selector" },
      }
  }

  return { message: cleanedText, clientAction: null }
}

function normalizeLegacyAction(parsed: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!parsed || typeof parsed !== "object") return null

  if (parsed.action === "show_new_email_draft") {
    return {
      type: "show_new_email_draft",
      to: parsed.to,
      toName: parsed.toName,
      recipientMatched: parsed.recipientMatched,
      subject: parsed.subject,
      body: parsed.body,
      provider: parsed.provider,
    }
  }

  if (parsed.action === "show_email_reply_draft") {
    return {
      type: "show_email_reply_draft",
      emailId: parsed.emailId,
      provider: parsed.provider,
      subject: parsed.subject,
      body: parsed.body,
    }
  }

  if (parsed.action === "show_jira_ticket_draft") {
    return {
      type: "show_jira_ticket_draft",
      title: parsed.title,
      description: parsed.description,
      priority: parsed.priority,
    }
  }

  if (parsed.action === "show_email_selector") {
    return { type: "show_email_selector" }
  }

  return null
}

function pickMessage(parsed: Record<string, unknown> | null, fallback: string) {
  return typeof parsed?.message === "string" && parsed.message.trim()
    ? parsed.message.trim()
    : fallback
}

function parseJsonFromAgentText(text: string): Record<string, unknown> | null {
  const trimmed = text.trim()

  try {
    const parsed = JSON.parse(trimmed)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    // Agent instructions may wrap JSON in a fenced code block.
  }

  const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fencedJson?.[1]) {
    try {
      const parsed = JSON.parse(fencedJson[1])
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null
    } catch {
      // Fall through.
    }
  }

  const firstBrace = trimmed.indexOf("{")
  const lastBrace = trimmed.lastIndexOf("}")
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const parsed = JSON.parse(trimmed.slice(firstBrace, lastBrace + 1))
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null
    } catch {
      return null
    }
  }

  return null
}
