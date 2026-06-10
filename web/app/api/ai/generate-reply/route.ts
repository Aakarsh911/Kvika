import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { requireAIConsent } from "@/lib/ai-consent"
import { checkRateLimit } from "@/lib/rate-limit"
import { generateReplyDraft } from "@/lib/reply-email"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rate = await checkRateLimit(`ai:generate-reply:${session.user.email}`, {
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

    const { emailSubject, emailBody, from, tone, additionalInstructions } = await request.json()

    if (!emailSubject || !emailBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const reply = await generateReplyDraft({
      emailSubject,
      emailBody,
      from,
      tone,
      additionalInstructions,
    })

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Generate reply error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
