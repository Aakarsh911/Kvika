import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { requireAIConsent } from "@/lib/ai-consent"
import { checkRateLimit } from "@/lib/rate-limit"
import { buildAgentRuntimePrompt } from "@/lib/agent-runtime-prompt"
import { extractToolResultsFromTrace } from "@/lib/agent-tool-results"
import { detectComposeEmailIntent } from "@/lib/compose-intent"
import { composeEmailDraft } from "@/lib/compose-email"
import { extractAgentClientAction, invokeChronoFlowAgent, type AgentClientAction } from "@/lib/bedrock-agent"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type SelectedEmail = {
  id: string
  subject: string
  from: {
    name: string
    address: string
  }
  provider: "gmail" | "outlook"
  bodyPreview: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rate = await checkRateLimit(`ai:agent:${session.user.email}`, {
      limit: 20,
      windowSeconds: 60,
    })
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests", message: `Slow down — try again in ${rate.retryAfterSeconds}s.` },
        { status: 429 },
      )
    }

    try {
      await requireAIConsent(session.user.email)
    } catch {
      return NextResponse.json(
        {
          error: "AI consent required",
          code: "AI_CONSENT_REQUIRED",
          message: "You must grant consent to use AI features. Please enable AI features in Settings.",
        },
        { status: 403 },
      )
    }

    const {
      messages,
      selectedEmail,
      sessionId,
      timeZone,
      currentTime,
    }: {
      messages?: ChatMessage[]
      selectedEmail?: SelectedEmail | null
      sessionId?: string
      timeZone?: string
      currentTime?: string
    } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage?.content || lastMessage.role !== "user") {
      return NextResponse.json({ error: "Missing user message" }, { status: 400 })
    }

    const agentSessionId = sanitizeSessionId(sessionId) || randomUUID()

    const composeIntent = detectComposeEmailIntent(lastMessage.content)
    if (composeIntent) {
      const draft = await composeEmailDraft({
        userEmail: session.user.email,
        to: composeIntent.to,
        context: composeIntent.context,
        tone: composeIntent.tone,
      })
      const built = buildNewEmailClientResponse(draft, agentSessionId)
      return NextResponse.json(built)
    }

    const inputText = buildAgentRuntimePrompt({
      lastUserMessage: lastMessage.content,
      selectedEmail,
      timeZone,
      currentTime,
    })

    const promptSessionAttributes: Record<string, string> = {}
    if (selectedEmail) {
      promptSessionAttributes.selectedEmailId = selectedEmail.id
      promptSessionAttributes.selectedEmailProvider = selectedEmail.provider
      promptSessionAttributes.selectedEmailSubject = selectedEmail.subject
    }

    const result = await invokeChronoFlowAgent({
      inputText,
      sessionId: agentSessionId,
      sessionAttributes: {
        userEmail: session.user.email,
      },
      promptSessionAttributes,
      enableTrace: true,
    })

    const toolResult = extractToolResultsFromTrace(result.traces)
    if (toolResult.clientAction) {
      return NextResponse.json({
        message: toolResult.message || result.text || "Done.",
        clientAction: toolResult.clientAction,
        clientActions: toolResult.clientActions,
        clientActionMessages: toolResult.messages,
        sessionId: result.sessionId,
      })
    }

    const { message, clientAction } = extractAgentClientAction(result.text)

    return NextResponse.json({
      message: message || "I apologize, but I could not generate a response.",
      clientAction,
      sessionId: result.sessionId,
    })
  } catch (error) {
    console.error("AI Agent error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function sanitizeSessionId(sessionId?: string) {
  if (!sessionId) return null
  const trimmed = sessionId.trim()
  if (!/^[A-Za-z0-9._:-]{2,100}$/.test(trimmed)) return null
  return trimmed
}

function buildNewEmailClientResponse(
  draft: Awaited<ReturnType<typeof composeEmailDraft>>,
  sessionId: string,
) {
  const displayName = draft.toName || draft.to || "your recipient"
  const clientAction: AgentClientAction = {
    type: "show_new_email_draft",
    to: draft.to ?? "",
    toName: draft.toName,
    recipientMatched: draft.recipientMatched,
    subject: draft.subject,
    body: draft.body,
    provider: "gmail",
  }

  return {
    message: draft.recipientMatched
      ? `I've drafted an email to ${displayName}:`
      : `I've drafted the email. Pick ${displayName} from suggestions to confirm their address:`,
    clientAction,
    clientActions: [clientAction],
    clientActionMessages: [
      draft.recipientMatched
        ? `I've drafted an email to ${displayName}:`
        : `I've drafted the email. Pick ${displayName} from suggestions to confirm their address:`,
    ],
    sessionId,
  }
}
