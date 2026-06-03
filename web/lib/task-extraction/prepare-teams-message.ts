import { stripHtml } from "./normalize"
import type { TeamsMessageInput } from "./types"

/** Minimum stripped text length — only blocks empty/noise, not content classification. */
const MIN_TEXT_LENGTH = 3

export type PreparedTeamsMessage = {
  message: TeamsMessageInput
  text: string
}

export type PrepareSkipReason = "empty" | "too_short"

/**
 * Hygiene only: strip HTML and drop messages with no usable text.
 * All classification (task vs discussion vs social) is done by the LLM.
 */
export function prepareTeamsMessage(
  message: TeamsMessageInput,
): { skipped: true; skipReason: PrepareSkipReason } | { skipped: false; prepared: PreparedTeamsMessage } {
  const text = stripHtml(message.body).trim()

  if (!text) {
    return { skipped: true, skipReason: "empty" }
  }

  if (text.length < MIN_TEXT_LENGTH) {
    return { skipped: true, skipReason: "too_short" }
  }

  return { skipped: false, prepared: { message, text } }
}

export function messageContext(message: TeamsMessageInput): string {
  return (
    message.subject ||
    [message.teamName, message.channelName].filter(Boolean).join(" · ") ||
    "Teams chat"
  )
}
