import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { requireAIConsent } from "@/lib/ai-consent"
import { checkRateLimit } from "@/lib/rate-limit"
import { prisma } from "@/lib/prisma"
import { invalidateCache } from "@/lib/redis"
import { runTeamsExtractionPipeline } from "@/lib/task-extraction/pipeline-teams"

/**
 * Extract actionable tasks from Teams messages using the extraction pipeline.
 * POST /api/tasks/extract-from-teams
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rate = await checkRateLimit(`ai:extract-teams:${session.user.email}`, {
      limit: 6,
      windowSeconds: 60,
    })
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests", message: `Slow down — try again in ${rate.retryAfterSeconds}s.` },
        { status: 429 },
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
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

    const startTime = Date.now()
    console.log(`🤖 [Teams Pipeline] Starting for user ${user.id}`)

    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin
    const messagesRes = await fetch(`${baseUrl}/api/teams/saved-messages`, {
      headers: { Cookie: request.headers.get("cookie") || "" },
    })

    if (!messagesRes.ok) {
      const errorData = await messagesRes.json().catch(() => ({}))
      return NextResponse.json(
        {
          error: errorData.error || "Failed to fetch Teams messages",
          needsReauth: errorData.needsReauth,
        },
        { status: messagesRes.status },
      )
    }

    const messagesData = await messagesRes.json()
    const messages = messagesData.messages || []

    if (messages.length === 0) {
      return NextResponse.json({
        success: true,
        extracted: 0,
        created: 0,
        messagesProcessed: 0,
        stats: null,
        message:
          "No Teams messages found. Connect Microsoft in Settings and ensure you have recent channel or chat activity.",
      })
    }

    const { tasks: createdTasks, stats } = await runTeamsExtractionPipeline(
      prisma,
      user.id,
      messages,
    )

    await invalidateCache(`tasks:${user.id}`)

    const duration = Date.now() - startTime
    console.log(`✅ [Teams Pipeline] Done in ${duration}ms`, stats)

    return NextResponse.json({
      success: true,
      extracted: stats.tasksExtracted,
      created: stats.tasksCreated,
      messagesProcessed: stats.messagesScanned,
      duplicatesSkipped: stats.duplicatesSkipped,
      stats,
      tasks: createdTasks,
      message:
        stats.tasksCreated === 0
          ? stats.messagesActionable === 0
            ? `Scanned ${stats.messagesScanned} message(s) across ${stats.llmBatches} AI batch(es). No actionable tasks found (discussion-only or no clear assignment).`
            : `Found ${stats.tasksExtracted} action item(s) but all were already in your task list.`
          : undefined,
    })
  } catch (error) {
    console.error("❌ [Teams Pipeline] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to extract tasks from Teams messages",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
