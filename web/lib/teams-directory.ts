import { Client } from "@microsoft/microsoft-graph-client"
import { Provider } from "@prisma/client"
import "isomorphic-fetch"
import { prisma } from "@/lib/prisma"

const MICROSOFT_SCOPE =
  "openid email profile offline_access User.Read Calendars.Read Calendars.Read.Shared Calendars.ReadWrite Calendars.ReadWrite.Shared OnlineMeetings.Read OnlineMeetings.ReadWrite Mail.Read Mail.Send MailboxSettings.Read Chat.Read ChatMessage.Read ChannelMessage.Read.All Team.ReadBasic.All TeamMember.Read.All"

export type TeamDirectoryMember = {
  id: string
  displayName: string
  email?: string
  jobTitle?: string
}

export type ResolvedAttendee = {
  /** The raw value the user provided (name or email). */
  query: string
  name: string
  email: string | null
  matched: boolean
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function getMicrosoftAccessToken(userEmail: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { integrations: { where: { provider: Provider.MICROSOFT } } },
  })

  const integration = user?.integrations?.[0]
  if (!integration?.accessToken) return null

  if (integration.expiresAt && new Date() < integration.expiresAt) {
    return integration.accessToken
  }

  if (!integration.refreshToken) return integration.accessToken

  const resp = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AZURE_AD_CLIENT_ID || "",
      client_secret: process.env.AZURE_AD_CLIENT_SECRET || "",
      refresh_token: integration.refreshToken,
      grant_type: "refresh_token",
      scope: MICROSOFT_SCOPE,
    }),
  })

  if (!resp.ok) {
    return integration.accessToken
  }

  const tokenData = await resp.json()
  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || integration.refreshToken,
      expiresAt: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000),
    },
  })

  return tokenData.access_token
}

/** Fetch the user's Teams colleagues from Microsoft Graph. Returns [] if unavailable. */
export async function getTeamDirectory(userEmail: string): Promise<TeamDirectoryMember[]> {
  const accessToken = await getMicrosoftAccessToken(userEmail)
  if (!accessToken) return []

  const client = Client.init({ authProvider: (done) => done(null, accessToken) })

  let teams: Array<{ id: string }> = []
  try {
    const teamsResp = await client.api("/me/joinedTeams").select("id,displayName").get()
    teams = teamsResp.value || []
  } catch {
    return []
  }

  const seen = new Set<string>()
  const members: TeamDirectoryMember[] = []

  for (const team of teams.slice(0, 5)) {
    try {
      const memResp = await client.api(`/teams/${team.id}/members`).get()
      for (const m of memResp.value || []) {
        const userId = m.userId || m?.user?.id
        const displayName = m.displayName || m?.user?.displayName || "Unknown"
        if (!userId || seen.has(userId)) continue
        seen.add(userId)

        const fallbackEmail = m.email || m?.user?.mail || m?.user?.userPrincipalName
        let email: string | undefined = fallbackEmail
        let jobTitle: string | undefined
        try {
          const userObj = await client
            .api(`/users/${userId}`)
            .select("id,displayName,mail,userPrincipalName,jobTitle")
            .get()
          email = userObj.mail || userObj.userPrincipalName || fallbackEmail
          jobTitle = userObj.jobTitle || undefined
        } catch {
          // keep fallback email
        }

        members.push({ id: userId, displayName, email, jobTitle })
      }
    } catch {
      // skip team on error, keep going
    }
  }

  return members
}

function scoreNameMatch(query: string, name: string): number {
  const q = query.trim().toLowerCase()
  const n = name.trim().toLowerCase()
  if (!q || !n) return 0
  if (n === q) return 100
  const parts = n.split(/\s+/)
  if (parts.includes(q)) return 90 // exact first/last name token
  if (parts.some((p) => p.startsWith(q))) return 70
  if (n.includes(q)) return 50
  return 0
}

/**
 * Resolve a list of attendee strings (names or emails) into emails.
 * Emails pass through directly; names are matched against the Teams directory.
 */
export async function resolveAttendees(
  userEmail: string,
  attendees: string[],
): Promise<ResolvedAttendee[]> {
  const cleaned = attendees.map((a) => a.trim()).filter(Boolean)
  if (cleaned.length === 0) return []

  const needsDirectory = cleaned.some((a) => !EMAIL_REGEX.test(a))
  const directory = needsDirectory ? await getTeamDirectory(userEmail) : []

  return cleaned.map((query) => {
    if (EMAIL_REGEX.test(query)) {
      return { query, name: query, email: query, matched: true }
    }

    let best: TeamDirectoryMember | null = null
    let bestScore = 0
    for (const member of directory) {
      if (!member.email) continue
      const score = scoreNameMatch(query, member.displayName)
      if (score > bestScore) {
        bestScore = score
        best = member
      }
    }

    if (best && bestScore >= 50) {
      return { query, name: best.displayName, email: best.email ?? null, matched: true }
    }

    return { query, name: query, email: null, matched: false }
  })
}
