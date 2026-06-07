import { Provider } from "@prisma/client"
import { google } from "googleapis"
import { prisma } from "@/lib/prisma"

export type EmailContent = {
  id: string
  subject: string
  from: { name: string; address: string }
  bodyText: string
  bodyHtml: string
  provider: "gmail" | "outlook"
}

export async function getEmailContentForUser(params: {
  userEmail: string
  emailId: string
  provider: "gmail" | "outlook"
}): Promise<EmailContent> {
  const user = await prisma.user.findUnique({
    where: { email: params.userEmail },
    include: {
      integrations: {
        where: { provider: params.provider === "gmail" ? Provider.GOOGLE : Provider.MICROSOFT },
      },
    },
  })

  if (!user || !user.integrations.length) {
    throw new Error(`${params.provider} account not connected`)
  }

  const integration = user.integrations[0]
  let accessToken: string | null = integration.accessToken
  let refreshToken: string | null | undefined = integration.refreshToken

  if (integration.expiresAt && new Date() >= integration.expiresAt) {
    if (!integration.refreshToken) {
      throw new Error("Token expired. Please reconnect your account.")
    }

    if (params.provider === "gmail") {
      const oauth2ClientRefresh = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
      )
      oauth2ClientRefresh.setCredentials({ refresh_token: integration.refreshToken })
      const { credentials } = await oauth2ClientRefresh.refreshAccessToken()
      accessToken = credentials.access_token || integration.accessToken
      refreshToken = credentials.refresh_token || integration.refreshToken
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          accessToken: credentials.access_token || integration.accessToken,
          refreshToken: credentials.refresh_token || integration.refreshToken,
          expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        },
      })
    } else {
      const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          refresh_token: integration.refreshToken,
          grant_type: "refresh_token",
        }),
      })
      if (!tokenResponse.ok) {
        throw new Error("Failed to refresh Microsoft token")
      }
      const tokens = await tokenResponse.json()
      accessToken = tokens.access_token
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || integration.refreshToken,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        },
      })
    }
  }

  if (!accessToken) {
    throw new Error("No access token")
  }

  if (params.provider === "gmail") {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
    )
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken || undefined,
    })

    const gmail = google.gmail({ version: "v1", auth: oauth2Client })
    const msg = await gmail.users.messages.get({
      userId: "me",
      id: params.emailId,
      format: "full",
    })

    const headers = msg.data.payload?.headers || []
    const subject = headers.find((h) => h.name === "Subject")?.value || "(No subject)"
    const from = headers.find((h) => h.name === "From")?.value || "Unknown"

    const emailMatch = from.match(/<(.+?)>/)
    const fromEmail = emailMatch ? emailMatch[1] : from
    const fromName = from.replace(/<.+?>/, "").trim() || fromEmail

    let bodyText = ""
    let bodyHtml = ""

    const extractBody = (part: any): void => {
      if (part.body?.data) {
        const decoded = Buffer.from(part.body.data, "base64").toString("utf-8")
        if (part.mimeType === "text/html") bodyHtml = decoded
        else if (part.mimeType === "text/plain") bodyText = decoded
      }
      if (part.parts) part.parts.forEach(extractBody)
    }

    extractBody(msg.data.payload)

    return {
      id: msg.data.id!,
      subject,
      from: { name: fromName, address: fromEmail },
      bodyText,
      bodyHtml,
      provider: "gmail",
    }
  }

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${params.emailId}?$select=id,subject,from,body,bodyPreview`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  )

  if (!response.ok) {
    throw new Error("Failed to fetch Outlook email")
  }

  const email = await response.json()

  return {
    id: email.id,
    subject: email.subject,
    from: {
      name: email.from.emailAddress.name,
      address: email.from.emailAddress.address,
    },
    bodyText: email.body?.contentType === "text" ? email.body.content : "",
    bodyHtml: email.body?.contentType === "html" ? email.body.content : email.bodyPreview || "",
    provider: "outlook",
  }
}
