import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { isInternalAgentAuthorized } from "@/lib/internal-agent-auth"
import { buildJiraTicketDraftAction, jiraTicketDraftInputSchema } from "@/lib/jira-ticket-draft"

export async function POST(request: NextRequest) {
  if (!isInternalAgentAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const input = jiraTicketDraftInputSchema.parse(body)
    const draft = buildJiraTicketDraftAction(input)

    return NextResponse.json(draft)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid Jira ticket request", details: error.flatten() },
        { status: 400 },
      )
    }

    console.error("Internal prepare Jira ticket error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
