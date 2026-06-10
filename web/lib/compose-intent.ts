const TONE_HINTS: Record<string, "professional" | "casual" | "friendly" | "formal"> = {
  casual: "casual",
  friendly: "friendly",
  formal: "formal",
  professional: "professional",
}

export type ComposeEmailIntent = {
  to: string
  context: string
  tone?: "professional" | "casual" | "friendly" | "formal"
}

function cleanRecipient(raw: string): string {
  return raw.replace(/^['"]|['"]$/g, "").trim()
}

function detectTone(text: string): ComposeEmailIntent["tone"] | undefined {
  const lower = text.toLowerCase()
  for (const [word, tone] of Object.entries(TONE_HINTS)) {
    if (lower.includes(word)) return tone
  }
  return undefined
}

/**
 * Detect when the user wants a new email composed from natural language.
 * Returns recipient + context so we can draft without relying on the Bedrock tool schema.
 */
export function detectComposeEmailIntent(message: string): ComposeEmailIntent | null {
  const text = message.trim()
  if (!text) return null

  const patterns: { re: RegExp; contextGroup: number }[] = [
    {
      re: /^(?:please\s+)?(?:send|write|compose|draft)\s+(?:an?\s+)?email\s+to\s+(.+?)\s+(?:about|asking|regarding|re:?\s*)\s+(.+)$/i,
      contextGroup: 2,
    },
    {
      re: /^(?:please\s+)?email\s+(.+?)\s+(?:about|asking|regarding|re:?\s*)\s+(.+)$/i,
      contextGroup: 2,
    },
    {
      re: /^(?:please\s+)?(?:send|write|compose|draft)\s+(?:an?\s+)?email\s+to\s+(.+?)[,.]\s+(.+)$/i,
      contextGroup: 2,
    },
  ]

  for (const { re, contextGroup } of patterns) {
    const match = text.match(re)
    if (!match) continue
    const to = cleanRecipient(match[1])
    const context = match[contextGroup]?.trim()
    if (!to || !context) continue
    return { to, context, tone: detectTone(text) }
  }

  return null
}
