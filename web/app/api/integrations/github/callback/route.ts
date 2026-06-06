import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { randomUUID } from "crypto"
import { Provider } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { cache, cacheKeys } from "@/lib/redis"

const STATE_COOKIE = "github_oauth_state"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const email = (session as any)?.user?.email as string | undefined
  if (!email) return NextResponse.redirect(new URL("/login", req.url))

  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const cookieState = req.cookies.get(STATE_COOKIE)?.value

  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=github_no_code", req.url))
  }
  if (!state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(new URL("/settings?error=github_state", req.url))
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  const redirectUri = process.env.GITHUB_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/settings?error=github_env", req.url))
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      const t = await tokenRes.text().catch(() => "")
      console.error("GitHub token exchange failed:", tokenRes.status, t)
      return NextResponse.redirect(new URL("/settings?error=github_token", req.url))
    }

    const tokens = await tokenRes.json()
    if (!tokens?.access_token) {
      return NextResponse.redirect(new URL("/settings?error=github_payload", req.url))
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })

    if (!userRes.ok) {
      console.error("GitHub user fetch failed:", userRes.status)
      return NextResponse.redirect(new URL("/settings?error=github_user", req.url))
    }

    const ghUser = await userRes.json()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.redirect(new URL("/settings?error=github_user", req.url))
    }

    await prisma.integration.upsert({
      where: { userId_provider: { userId: user.id, provider: Provider.GITHUB } },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        scope: tokens.scope ?? "read:user repo",
        expiresAt: null,
        accountId: String(ghUser.id),
        data: { login: ghUser.login, ...tokens },
      },
      create: {
        id: randomUUID(),
        userId: user.id,
        provider: Provider.GITHUB,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        scope: tokens.scope ?? "read:user repo",
        expiresAt: null,
        accountId: String(ghUser.id),
        data: { login: ghUser.login, ...tokens },
      },
    })

    await cache.del(cacheKeys.integrations(user.id))

    const response = NextResponse.redirect(new URL("/settings?connected=github", req.url))
    response.cookies.delete(STATE_COOKIE)
    return response
  } catch (e) {
    console.error("GitHub callback error", e)
    return NextResponse.redirect(new URL("/settings?error=github", req.url))
  }
}
