/** Strip HTML and collapse whitespace from Teams / rich-text bodies. */
export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}

export function normalizePriority(value: unknown): "Low" | "Medium" | "High" {
  const raw = String(value ?? "medium").toLowerCase()
  if (raw === "high" || raw === "urgent") return "High"
  if (raw === "low") return "Low"
  return "Medium"
}

export function slugForSourceId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)
}

const MONTHS: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
}

function toIsoDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month, day))
  if (date.getUTCMonth() !== month || date.getUTCDate() !== day) return null
  return date.toISOString().slice(0, 10)
}

/** Parse natural-language due dates from message text (e.g. "2nd of July"). */
export function parseDueDateFromText(text: string, referenceDate = new Date()): string | null {
  const normalized = text.trim()

  const isoMatch = normalized.match(/\b(20\d{2}-\d{2}-\d{2})\b/)
  if (isoMatch) return isoMatch[1]

  const ordinalMonth = normalized.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/i,
  )
  if (ordinalMonth) {
    const day = Number.parseInt(ordinalMonth[1], 10)
    const month = MONTHS[ordinalMonth[2].toLowerCase()]
    if (month !== undefined) {
      let year = referenceDate.getFullYear()
      const candidate = new Date(year, month, day)
      if (candidate < new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())) {
        year += 1
      }
      return toIsoDate(year, month, day)
    }
  }

  const monthFirst = normalized.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i,
  )
  if (monthFirst) {
    const month = MONTHS[monthFirst[1].toLowerCase()]
    const day = Number.parseInt(monthFirst[2], 10)
    if (month !== undefined) {
      let year = referenceDate.getFullYear()
      const candidate = new Date(year, month, day)
      if (candidate < new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())) {
        year += 1
      }
      return toIsoDate(year, month, day)
    }
  }

  return null
}

export function normalizeDueDate(value: unknown, fallbackText?: string): string | null {
  if (value) {
    const parsed = new Date(String(value))
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10)
    }
  }
  if (fallbackText) {
    return parseDueDateFromText(fallbackText)
  }
  return null
}
