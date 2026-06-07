import { Client } from "@microsoft/microsoft-graph-client"
import { Provider } from "@prisma/client"
import "isomorphic-fetch"
import { prisma } from "@/lib/prisma"

const MICROSOFT_SCOPE =
  "openid email profile offline_access User.Read User.ReadBasic.All People.Read Calendars.Read Calendars.Read.Shared Calendars.ReadWrite Calendars.ReadWrite.Shared OnlineMeetings.Read OnlineMeetings.ReadWrite Mail.Read Mail.Send MailboxSettings.Read Chat.Read ChatMessage.Read ChannelMessage.Read.All Team.ReadBasic.All TeamMember.Read.All"

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

/**
 * Build a name→email directory from people the user has already met with,
 * using attendees stored on their ChronoFlow calendar events. Needs no extra
 * Microsoft Graph scopes, so it works even when Teams directory access doesn't.
 */
export async function getCalendarContacts(userEmail: string): Promise<TeamDirectoryMember[]> {
  const user = await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true } })
  if (!user) return []

  const events = await prisma.calendarEvent.findMany({
    where: { userId: user.id },
    orderBy: { startTime: "desc" },
    take: 400,
    select: { attendees: true },
  })

  const byEmail = new Map<string, TeamDirectoryMember>()
  for (const event of events) {
    const attendees = event.attendees as unknown
    if (!Array.isArray(attendees)) continue
    for (const raw of attendees) {
      const a = raw as Record<string, unknown>
      const email = typeof a.email === "string" ? a.email : undefined
      const name =
        typeof a.name === "string" && a.name.trim()
          ? a.name
          : email
      if (!email || !name) continue
      const key = email.toLowerCase()
      if (!byEmail.has(key)) {
        byEmail.set(key, { id: key, displayName: name, email })
      }
    }
  }

  return Array.from(byEmail.values())
}

/** Fetch the user's Teams colleagues from Microsoft Graph. Returns [] if unavailable. */
export async function getTeamDirectory(userEmail: string): Promise<TeamDirectoryMember[]> {
  const accessToken = await getMicrosoftAccessToken(userEmail)
  if (!accessToken) return []
  return getTeamMembersWithToken(accessToken)
}

async function getTeamMembersWithToken(accessToken: string): Promise<TeamDirectoryMember[]> {
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

/**
 * Search the organization directory (and the user's relevant people) for a name
 * via Microsoft Graph. Requires User.ReadBasic.All / People.Read scopes.
 * Returns the best email match, or null.
 */
async function searchOrgDirectory(
  accessToken: string,
  name: string,
): Promise<TeamDirectoryMember | null> {
  const candidates = await fetchOrgCandidates(accessToken, name)

  let best: TeamDirectoryMember | null = null
  let bestScore = 0
  for (const c of candidates) {
    const score = scoreNameMatch(name, c.displayName)
    if (score > bestScore) {
      bestScore = score
      best = c
    }
  }

  return best && bestScore >= 50 ? best : null
}

async function fetchOrgCandidates(
  accessToken: string,
  name: string,
): Promise<TeamDirectoryMember[]> {
  const client = Client.init({ authProvider: (done) => done(null, accessToken) })
  const escaped = name.replace(/'/g, "''")

  const candidates: TeamDirectoryMember[] = []

  // 1) Org directory search (matches anyone in the tenant by name).
  try {
    const resp = await client
      .api("/users")
      .header("ConsistencyLevel", "eventual")
      .query({ $search: `"displayName:${name}"`, $count: "true" })
      .select("displayName,mail,userPrincipalName")
      .top(15)
      .get()
    for (const u of resp.value || []) {
      const email = u.mail || u.userPrincipalName
      if (email) candidates.push({ id: email, displayName: u.displayName || email, email })
    }
  } catch {
    // Fall back to a prefix filter if $search isn't permitted.
    try {
      const resp = await client
        .api("/users")
        .filter(`startswith(displayName,'${escaped}')`)
        .select("displayName,mail,userPrincipalName")
        .top(15)
        .get()
      for (const u of resp.value || []) {
        const email = u.mail || u.userPrincipalName
        if (email) candidates.push({ id: email, displayName: u.displayName || email, email })
      }
    } catch {
      // ignore
    }
  }

  // 2) Relevant people the user interacts with (great for frequent contacts).
  try {
    const resp = await client
      .api("/me/people")
      .query({ $search: `"${name}"` })
      .select("displayName,scoredEmailAddresses,userPrincipalName")
      .top(10)
      .get()
    for (const p of resp.value || []) {
      const email = p.scoredEmailAddresses?.[0]?.address || p.userPrincipalName
      if (email) candidates.push({ id: email, displayName: p.displayName || email, email })
    }
  } catch {
    // ignore
  }

  return candidates
}

/**
 * Typeahead search across all available people sources for the meeting UI.
 * Returns ranked {name, email} suggestions for a partial query.
 */
export async function searchPeople(
  userEmail: string,
  query: string,
  limit = 8,
): Promise<{ name: string; email: string }[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const accessToken = await getMicrosoftAccessToken(userEmail)

  const [teamMembers, calendarContacts, orgCandidates] = await Promise.all([
    accessToken ? getTeamMembersWithToken(accessToken).catch(() => []) : Promise.resolve([]),
    getCalendarContacts(userEmail).catch(() => []),
    accessToken ? fetchOrgCandidates(accessToken, q).catch(() => []) : Promise.resolve([]),
  ])

  const byEmail = new Map<string, { member: TeamDirectoryMember; score: number }>()
  for (const member of [...teamMembers, ...calendarContacts, ...orgCandidates]) {
    if (!member.email) continue
    const score = scoreNameMatch(q, member.displayName)
    if (score <= 0) continue
    const key = member.email.toLowerCase()
    const existing = byEmail.get(key)
    if (!existing || score > existing.score) {
      byEmail.set(key, { member, score })
    }
  }

  return Array.from(byEmail.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ member }) => ({ name: member.displayName, email: member.email as string }))
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

  // Build a local directory from Teams members + people from past meetings,
  // and keep the Microsoft token around for live org-directory lookups.
  let directory: TeamDirectoryMember[] = []
  let accessToken: string | null = null
  if (needsDirectory) {
    accessToken = await getMicrosoftAccessToken(userEmail)
    const [teamMembers, calendarContacts] = await Promise.all([
      accessToken ? getTeamMembersWithToken(accessToken).catch(() => []) : Promise.resolve([]),
      getCalendarContacts(userEmail).catch(() => []),
    ])
    const byEmail = new Map<string, TeamDirectoryMember>()
    for (const m of [...teamMembers, ...calendarContacts]) {
      if (!m.email) continue
      const key = m.email.toLowerCase()
      if (!byEmail.has(key)) byEmail.set(key, m)
    }
    directory = Array.from(byEmail.values())
  }

  const results: ResolvedAttendee[] = []
  for (const query of cleaned) {
    if (EMAIL_REGEX.test(query)) {
      results.push({ query, name: query, email: query, matched: true })
      continue
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
      results.push({ query, name: best.displayName, email: best.email ?? null, matched: true })
      continue
    }

    // Fall back to a live org-directory / people search.
    if (accessToken) {
      const orgMatch = await searchOrgDirectory(accessToken, query)
      if (orgMatch?.email) {
        results.push({ query, name: orgMatch.displayName, email: orgMatch.email, matched: true })
        continue
      }
    }

    results.push({ query, name: query, email: null, matched: false })
  }

  return results
}
