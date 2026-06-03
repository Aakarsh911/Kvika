export type ExtractedTaskDraft = {
  /** Stable id for dedupe — e.g. messageId#0 or emailId#title-slug */
  sourceId: string
  title: string
  description: string | null
  priority: "Low" | "Medium" | "High"
  dueDate: string | null
  confidence: number
  extractionMethod: "ai"
  sourceData: Record<string, unknown>
  url?: string | null
}

export type TeamsMessageInput = {
  id: string
  from: { name: string; email?: string | null }
  body: string
  createdDateTime: string
  subject?: string
  webUrl?: string | null
  chatId?: string | null
  teamName?: string | null
  channelName?: string | null
}

export type TeamsExtractionStats = {
  messagesScanned: number
  messagesSkipped: number
  messagesActionable: number
  tasksExtracted: number
  tasksCreated: number
  duplicatesSkipped: number
  skippedReasons: Record<string, number>
  /** LLM batch calls (after hygiene filter). */
  llmBatches: number
}
