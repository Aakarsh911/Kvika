import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { deleteCache, cacheKeys } from "@/lib/redis"
import { prisma } from "@/lib/prisma"
import {
  buildSourceId,
  fetchAssignedItems,
  getGitHubIntegration,
  isPullRequest,
  mapGitHubItemToTask,
  GitHubApiError,
} from "@/lib/github"

export async function POST() {
  const session = await getServerSession(authOptions)
  const email = (session as any)?.user?.email as string | undefined
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const integration = await getGitHubIntegration(user.id)
  if (!integration?.accessToken) {
    return NextResponse.json({ error: "GitHub not integrated" }, { status: 400 })
  }

  let items
  try {
    items = await fetchAssignedItems(integration.accessToken)
  } catch (e) {
    if (e instanceof GitHubApiError) {
      console.error("GitHub sync failed:", e.status, e.body)
      const message =
        e.status === 401
          ? "GitHub authorization expired. Reconnect in Settings."
          : e.status === 403 || e.status === 429
            ? "GitHub API rate limit or permission error. Try again later or reconnect."
            : "Failed to fetch items from GitHub"
      return NextResponse.json(
        { error: message },
        { status: e.status === 429 ? 429 : 500 },
      )
    }
    return NextResponse.json({ error: "Failed to fetch items from GitHub" }, { status: 500 })
  }

  const syncedSourceIds = new Set<string>()
  let issueCount = 0
  let prCount = 0

  for (const item of items) {
    const sourceId = buildSourceId(item)
    syncedSourceIds.add(sourceId)

    if (isPullRequest(item)) {
      prCount++
    } else {
      issueCount++
    }

    const existingTask = await prisma.task.findUnique({
      where: {
        userId_source_sourceId: { userId: user.id, source: "GITHUB", sourceId },
      },
    })

    const taskData = mapGitHubItemToTask(item, user.id, existingTask)

    await prisma.task.upsert({
      where: {
        userId_source_sourceId: { userId: user.id, source: "GITHUB", sourceId },
      },
      update: taskData,
      create: taskData,
    })
  }

  const deletedCount = await prisma.task.deleteMany({
    where: {
      userId: user.id,
      source: "GITHUB",
      sourceId: { notIn: Array.from(syncedSourceIds) },
    },
  })

  await deleteCache(cacheKeys.tasks(user.id))
  await deleteCache(cacheKeys.githubIssues(user.id))

  const total = issueCount + prCount
  let message = `Synced ${total} item${total === 1 ? "" : "s"} from GitHub (${issueCount} issue${issueCount === 1 ? "" : "s"}, ${prCount} PR${prCount === 1 ? "" : "s"}).`
  if (deletedCount.count > 0) {
    message += ` Removed ${deletedCount.count} item${deletedCount.count === 1 ? "" : "s"} no longer assigned to you.`
  }

  return NextResponse.json({ message })
}
