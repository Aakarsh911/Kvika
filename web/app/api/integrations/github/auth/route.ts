import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

const STATE_COOKIE = "github_oauth_state"

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID
  const redirectUri = process.env.GITHUB_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Missing GitHub env" }, { status: 500 })
  }

  const state = randomBytes(16).toString("hex")
  const scope = encodeURIComponent("read:user repo")

  const url =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}` +
    `&state=${state}`

  const response = NextResponse.redirect(url)
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })

  return response
}
