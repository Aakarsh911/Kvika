import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
  type InvokeAgentCommandOutput,
} from "@aws-sdk/client-bedrock-agent-runtime"

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
      enableTrace: params.enableTrace ?? false,
      sessionState: {
        sessionAttributes: params.sessionAttributes,
        promptSessionAttributes: params.promptSessionAttributes,
      },
    }),
  )

  const decoder = new TextDecoder()
  let text = ""

  if (output.completion) {
    for await (const event of output.completion) {
      if (event.chunk?.bytes) {
        text += decoder.decode(event.chunk.bytes)
      }
    }
  }

  return {
    text: text.trim(),
    sessionId: params.sessionId,
  }
}

export type AgentClientAction =
  | {
      type: "show_new_email_draft"
      to: string
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

export function extractAgentClientAction(text: string): {
  message: string
  clientAction: AgentClientAction | null
} {
  const parsed = parseJsonFromAgentText(text)
  const rawAction = parsed?.clientAction ?? normalizeLegacyAction(parsed)

  if (!rawAction?.type) {
    const proseDraft = parseDraftFromAgentProse(text)
    if (proseDraft) return proseDraft
    return { message: text, clientAction: null }
  }

  switch (rawAction.type) {
    case "show_new_email_draft":
      if (
        typeof rawAction.to === "string" &&
        typeof rawAction.subject === "string" &&
        typeof rawAction.body === "string"
      ) {
        return {
          message: pickMessage(parsed, `I've drafted an email to ${rawAction.to}:`),
          clientAction: {
            type: "show_new_email_draft",
            to: rawAction.to,
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
          message: pickMessage(parsed, "I'll help you create a Jira ticket. Please review and edit the details:"),
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
  }

  return { message: text, clientAction: null }
}

function normalizeLegacyAction(parsed: any): any | null {
  if (!parsed || typeof parsed !== "object") return null

  if (parsed.action === "show_new_email_draft") {
    return {
      type: "show_new_email_draft",
      to: parsed.to,
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

  return null
}

function pickMessage(parsed: any, fallback: string) {
  return typeof parsed?.message === "string" && parsed.message.trim()
    ? parsed.message.trim()
    : fallback
}

function parseJsonFromAgentText(text: string): any | null {
  const trimmed = text.trim()

  try {
    return JSON.parse(trimmed)
  } catch {
    // Agent instructions may wrap JSON in a fenced code block.
  }

  const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fencedJson?.[1]) {
    try {
      return JSON.parse(fencedJson[1])
    } catch {
      // Fall through.
    }
  }

  const firstBrace = trimmed.indexOf("{")
  const lastBrace = trimmed.lastIndexOf("}")
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1))
    } catch {
      return null
    }
  }

  return null
}

function parseDraftFromAgentProse(text: string): {
  message: string
  clientAction: AgentClientAction
} | null {
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  const preMatch = text.match(/<pre>([\s\S]*?)<\/pre>/i)
  const draftText = preMatch?.[1]?.trim() || extractPlainTextDraft(text)

  if (!emailMatch || !draftText) {
    return null
  }

  const subjectMatch = draftText.match(/^Subject:\s*(.+)$/im)
  const subject = subjectMatch?.[1]?.trim() || "Follow up"
  const body = draftText.replace(/^Subject:\s*.+\r?\n+/im, "").trim()

  if (!body) {
    return null
  }

  return {
    message: `I've drafted an email to ${emailMatch[0]}:`,
    clientAction: {
      type: "show_new_email_draft",
      to: emailMatch[0],
      subject,
      body,
      provider: "gmail",
    },
  }
}

function extractPlainTextDraft(text: string) {
  const subjectIndex = text.search(/^Subject:\s*.+$/im)
  if (subjectIndex === -1) {
    return null
  }

  const draftAndTrailingText = text.slice(subjectIndex).trim()
  const trailingReviewText = draftAndTrailingText.search(
    /\n\s*(Please review|Let me know if you would like|Would you like|Review the draft)/i,
  )

  if (trailingReviewText === -1) {
    return draftAndTrailingText
  }

  return draftAndTrailingText.slice(0, trailingReviewText).trim()
}
