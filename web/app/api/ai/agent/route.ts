import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { requireAIConsent } from "@/lib/ai-consent"
import { buildAgentRuntimePrompt } from "@/lib/agent-runtime-prompt"
import { extractAgentClientAction, invokeChronoFlowAgent } from "@/lib/bedrock-agent"

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
    }: {
      messages?: ChatMessage[]
      selectedEmail?: SelectedEmail | null
      sessionId?: string
    } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage?.content) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 })
    }

    const agentSessionId = sanitizeSessionId(sessionId) || randomUUID()
    const inputText = buildAgentRuntimePrompt({
      messages,
      selectedEmail,
      userEmail: session.user.email,
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
      enableTrace: process.env.BEDROCK_AGENT_ENABLE_TRACE === "true",
    })

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
