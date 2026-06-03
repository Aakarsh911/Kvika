import { messageContext } from "./prepare-teams-message"
import { normalizeDueDate, normalizePriority, slugForSourceId } from "./normalize"
import type { ExtractedTaskDraft, TeamsMessageInput } from "./types"

/** Message-level confidence from the model must meet this to extract any tasks. */
export const MIN_MESSAGE_CONFIDENCE = 0.55

export function buildDraftsFromAiRows(
  message: TeamsMessageInput,
  text: string,
  rows: unknown[],
  messageConfidence: number,
): ExtractedTaskDraft[] {
  if (messageConfidence < MIN_MESSAGE_CONFIDENCE) return []

  const context = messageContext(message)
  const drafts: ExtractedTaskDraft[] = []

  rows.forEach((item, index) => {
    if (!item || typeof item !== "object") return
    const row = item as Record<string, unknown>
    const title = String(row.title ?? row.task ?? "").trim()
    if (!title || title.length < 4) return

    const taskConfidence =
      typeof row.confidence === "number" ? row.confidence : messageConfidence
    if (taskConfidence < MIN_MESSAGE_CONFIDENCE) return

    drafts.push({
      sourceId: `${message.id}#${slugForSourceId(title) || index}`,
      title: title.slice(0, 200),
      description: row.description ? String(row.description).slice(0, 500) : null,
      priority: normalizePriority(row.priority),
      dueDate: normalizeDueDate(row.dueDate, text),
      confidence: taskConfidence,
      extractionMethod: "ai",
      url: message.webUrl ?? null,
      sourceData: {
        from: message.from,
        messagePreview: text.slice(0, 500),
        createdDateTime: message.createdDateTime,
        context,
      },
    })
  })

  return drafts
}
