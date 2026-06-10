import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { z } from "zod"
import { composeEmailDraft, composeEmailInputSchema } from "@/lib/compose-email"
import { isInternalAgentAuthorized } from "@/lib/internal-agent-auth"

const internalComposeSchema = composeEmailInputSchema.extend({
  userEmail: z.string().email(),
})

export async function POST(request: NextRequest) {
  if (!isInternalAgentAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const input = internalComposeSchema.parse(body)

    if (!input.to) {
      return NextResponse.json(
        {
          error: "Missing recipient",
          code: "MISSING_RECIPIENT",
          message: "Ask the user who they want to email — a name is fine.",
        },
        { status: 400 }
      )
    }

    const draft = await composeEmailDraft(input)

    return NextResponse.json({
      action: "show_new_email_draft",
      to: draft.to ?? "",
      toName: draft.toName,
      recipientMatched: draft.recipientMatched,
      subject: draft.subject,
      body: draft.body,
      tone: draft.tone,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid compose email request", details: error.flatten() },
        { status: 400 }
      )
    }

    console.error("Internal compose email error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
