import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { composeEmailDraft, composeEmailInputSchema } from "@/lib/compose-email"

function isAuthorized(request: NextRequest) {
  const secret = process.env.INTERNAL_AGENT_SECRET
  if (!secret) return false

  const provided = request.headers.get("x-chronoflow-agent-secret")
  return provided === secret
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const input = composeEmailInputSchema.parse(body)

    if (!input.to) {
      return NextResponse.json(
        {
          error: "Missing recipient",
          code: "MISSING_RECIPIENT",
          message: "Ask the user for the recipient email address before drafting.",
        },
        { status: 400 }
      )
    }

    const draft = await composeEmailDraft(input)

    return NextResponse.json({
      action: "show_new_email_draft",
      to: draft.to,
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
