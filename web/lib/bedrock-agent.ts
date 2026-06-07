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
    })
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

export function extractAgentClientAction(text: string): {
  message: string
  clientAction: AgentClientAction | null
} {
  const parsed = parseJsonFromAgentText(text)
  const action =
    parsed?.clientAction?.type === "show_new_email_draft"
      ? parsed.clientAction
      : parsed?.action === "show_new_email_draft"
        ? {
            type: "show_new_email_draft",
            to: parsed.to,
            subject: parsed.subject,
            body: parsed.body,
            provider: parsed.provider,
          }
        : null

  if (!action) {
    const looseAction = parseLooseClientAction(text)
    if (looseAction) {
      return looseAction
    }

    const proseDraft = parseDraftFromAgentProse(text)
    if (proseDraft) {
      return proseDraft
    }

    return { message: text, clientAction: null }
  }

  if (
    typeof action.to !== "string" ||
    typeof action.subject !== "string" ||
    typeof action.body !== "string"
  ) {
    return { message: text, clientAction: null }
  }

  return {
    message:
      typeof parsed.message === "string" && parsed.message.trim()
        ? parsed.message.trim()
        : `I've drafted an email to ${action.to}:`,
    clientAction: {
      type: "show_new_email_draft",
      to: action.to,
      subject: action.subject,
      body: action.body,
      provider: action.provider === "outlook" ? "outlook" : "gmail",
    },
  }
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
      // Fall through to extracting a JSON object from prose.
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

function parseLooseClientAction(text: string): {
  message: string
  clientAction: AgentClientAction
} | null {
  if (!text.includes("show_new_email_draft")) {
    return null
  }

  const to = extractLooseStringField(text, "to")
  const subject = extractLooseStringField(text, "subject")
  const body = extractLooseStringField(text, "body")
  const provider = extractLooseStringField(text, "provider")
  const message = extractLooseStringField(text, "message")

  if (!to || !subject || !body) {
    return null
  }

  return {
    message: message || `I've drafted an email to ${to}:`,
    clientAction: {
      type: "show_new_email_draft",
      to,
      subject,
      body,
      provider: provider === "outlook" ? "outlook" : "gmail",
    },
  }
}

function extractLooseStringField(text: string, key: string) {
  const fieldStart = text.match(new RegExp(`"${key}"\\s*:\\s*"`))
  if (fieldStart?.index == null) {
    return null
  }

  const valueStart = fieldStart.index + fieldStart[0].length
  const rest = text.slice(valueStart)
  const nextField = rest.search(/"\s*,\s*"[A-Za-z_][A-Za-z0-9_]*"\s*:/)
  const objectEnd = rest.search(/"\s*}\s*}?/)
  const end = nextField !== -1 ? nextField : objectEnd

  if (end === -1) {
    return null
  }

  return rest
    .slice(0, end)
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .trim()
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

  const to = emailMatch[0]

  return {
    message: `I've drafted an email to ${to}:`,
    clientAction: {
      type: "show_new_email_draft",
      to,
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
    /\n\s*(Please review|Let me know if you would like|Would you like|Review the draft)/i
  )

  if (trailingReviewText === -1) {
    return draftAndTrailingText
  }

  return draftAndTrailingText.slice(0, trailingReviewText).trim()
}
