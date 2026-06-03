export function parseJsonArray(response: string): unknown[] {
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

  try {
    const direct = JSON.parse(cleaned)
    if (Array.isArray(direct)) return direct
    if (direct && typeof direct === "object" && Array.isArray((direct as { tasks?: unknown[] }).tasks)) {
      return (direct as { tasks: unknown[] }).tasks
    }
  } catch {
    // fall through
  }

  const match = cleaned.match(/\[[\s\S]*\]/)
  if (!match) return []

  try {
    const parsed = JSON.parse(match[0])
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function parseJsonObject(response: string): Record<string, unknown> | null {
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

  try {
    const direct = JSON.parse(cleaned)
    if (direct && typeof direct === "object" && !Array.isArray(direct)) {
      return direct as Record<string, unknown>
    }
  } catch {
    // fall through
  }

  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) return null

  try {
    return JSON.parse(match[0]) as Record<string, unknown>
  } catch {
    return null
  }
}
