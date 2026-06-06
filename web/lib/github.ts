import { Provider } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export type GitHubIssueItem = {
  id: number
  number: number
  title: string
  body: string | null
  state: string
  html_url: string
  repository_url: string
  labels: Array<{ name: string }>
  pull_request?: { url: string }
  [key: string]: unknown
}

const GITHUB_API_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
}

export async function getGitHubIntegration(userId: string) {
  return prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: Provider.GITHUB } },
  })
}

export function buildSourceId(issue: GitHubIssueItem): string {
  const match = issue.repository_url.match(/\/repos\/([^/]+\/[^/]+)$/)
  const repo = match?.[1] ?? "unknown/repo"
  return `${repo}#${issue.number}`
}

export function isPullRequest(issue: GitHubIssueItem): boolean {
  return Boolean(issue.pull_request)
}

function mapLabelToPriority(labels: Array<{ name: string }>): string | null {
  const names = labels.map((l) => l.name.toLowerCase())
  if (names.some((n) => n.includes("critical") || n.includes("p0") || n.includes("high"))) {
    return "High"
  }
  if (names.some((n) => n.includes("medium") || n.includes("p1"))) {
    return "Medium"
  }
  if (names.some((n) => n.includes("low") || n.includes("p2"))) {
    return "Low"
  }
  return null
}

export function mapGitHubItemToTask(
  issue: GitHubIssueItem,
  userId: string,
  existingTask?: { status: string; completedAt: Date | null } | null,
) {
  const closed = issue.state === "closed"
  const jiraStyleStatus = closed ? "Done" : "To Do"

  return {
    userId,
    title: issue.title,
    description: issue.body,
    status: existingTask?.status === "Done" ? "Done" : jiraStyleStatus,
    source: "GITHUB",
    sourceId: buildSourceId(issue),
    sourceData: issue as object,
    url: issue.html_url,
    priority: mapLabelToPriority(issue.labels ?? []),
    dueDate: null as Date | null,
    completedAt:
      existingTask?.completedAt ?? (closed ? new Date() : null),
  }
}

export function normalizeGitHubItem(issue: GitHubIssueItem) {
  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body: issue.body,
    state: issue.state,
    url: issue.html_url,
    sourceId: buildSourceId(issue),
    isPullRequest: isPullRequest(issue),
    labels: (issue.labels ?? []).map((l) => l.name),
    repo: buildSourceId(issue).split("#")[0],
  }
}

export async function fetchAssignedItems(accessToken: string): Promise<GitHubIssueItem[]> {
  const res = await fetch(
    "https://api.github.com/issues?filter=assigned&state=open&per_page=100",
    {
      headers: {
        ...GITHUB_API_HEADERS,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new GitHubApiError(res.status, body)
  }

  return res.json()
}

export class GitHubApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`GitHub API error ${status}`)
    this.name = "GitHubApiError"
  }
}
