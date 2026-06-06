import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getCache, setCache, cacheKeys, cacheTTL } from "@/lib/redis"
import { prisma } from "@/lib/prisma"
import {
  fetchAssignedItems,
  getGitHubIntegration,
  normalizeGitHubItem,
  GitHubApiError,
} from "@/lib/github"

export async function GET() {
  const session = await getServerSession(authOptions)
  const email = (session as any)?.user?.email as string | undefined
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const cacheKey = cacheKeys.githubIssues(user.id)
  const cached = await getCache(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  const integration = await getGitHubIntegration(user.id)
  if (!integration?.accessToken) {
    return NextResponse.json({ items: [] })
  }

  try {
    const raw = await fetchAssignedItems(integration.accessToken)
    const items = raw.map(normalizeGitHubItem)
    const result = { items }
    await setCache(cacheKey, result, cacheTTL.githubIssues)
    return NextResponse.json(result)
  } catch (e) {
    if (e instanceof GitHubApiError) {
      console.error("GitHub issues fetch failed:", e.status, e.body)
    }
    return NextResponse.json({ items: [] })
  }
}
