import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { z } from "zod"
import { isInternalAgentAuthorized } from "@/lib/internal-agent-auth"
import { getEmailContentForUser } from "@/lib/mail/get-email-content"
import { generateReplyDraft } from "@/lib/reply-email"

const replyEmailRequestSchema = z.object({
  userEmail: z.string().email(),
  emailId: z.string().min(1),
  provider: z.enum(["gmail", "outlook"]),
  tone: z.enum(["professional", "casual", "friendly", "formal"]).optional(),
  additionalInstructions: z.string().max(4000).optional(),
})

export async function POST(request: NextRequest) {
  if (!isInternalAgentAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const input = replyEmailRequestSchema.parse(body)

    const email = await getEmailContentForUser({
      userEmail: input.userEmail,
      emailId: input.emailId,
      provider: input.provider,
    })

    const reply = await generateReplyDraft({
      emailSubject: email.subject,
      emailBody: email.bodyText || email.bodyHtml,
      from: email.from,
      tone: input.tone,
      additionalInstructions: input.additionalInstructions,
    })

    return NextResponse.json({
      action: "show_email_reply_draft",
      emailId: email.id,
      provider: email.provider,
      subject: email.subject,
      body: reply,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid reply email request", details: error.flatten() },
        { status: 400 },
      )
    }

    console.error("Internal reply email error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
