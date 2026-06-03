import { generateText } from "@/lib/ai"

import { MIN_MESSAGE_CONFIDENCE, buildDraftsFromAiRows } from "./build-teams-draft"
import { messageContext, type PreparedTeamsMessage } from "./prepare-teams-message"
import { parseJsonArray, parseJsonObject } from "./parse-ai-json"
import type { ExtractedTaskDraft } from "./types"

export const TEAMS_BATCH_SIZE = 8

const EXTRACTION_SYSTEM = `You analyze Microsoft Teams messages for a single user who wants a personal task list.

Your job is to decide, per message, whether it contains a concrete action item FOR THAT USER (or clearly assigned to them) — not general team discussion.

EXTRACT a task only when the message clearly implies someone should DO something, e.g.:
- Direct request: "can you", "please", "need you to", "@user handle this"
- Explicit commitment with ownership: "I will send the email today", "I'll open the ticket"
- Assigned work with a deliverable or deadline
- Clear action item / follow-up with owner

DO NOT extract tasks from:
- Technical discussion, debugging threads, or architecture debate with no assignment
- Sharing opinions, questions, hypotheses ("what if we", "could it be", "any thoughts?")
- Status updates with no new ask ("we deployed yesterday", "looks good to me")
- Reactions, jokes, social chat, acknowledgments ("thanks", "lol", "nice")
- Vague interest with no deliverable ("we should maybe look at redis sometime")
- Quoted context where the actionable part is historical and already done

When unsure, return hasActionableItems: false — false negatives are better than inventing tasks.

Each extracted task needs a concise imperative title. Use the message body for due dates when stated.`

function buildBatchPrompt(
  items: PreparedTeamsMessage[],
  userProfile?: { name: string | null; email: string | null } | null,
): string {
  const referenceYear = new Date().getFullYear()

  // Build current user context if available
  let userContext = "You are extracting tasks for the logged-in user."
  if (userProfile) {
    const parts = []
    if (userProfile.name) parts.push(`Name: "${userProfile.name}"`)
    if (userProfile.email) parts.push(`Email/UPN: "${userProfile.email}"`)
    if (parts.length > 0) {
      userContext = `We are extracting tasks for the logged-in user:
${parts.join("\n")}

Use this context to resolve who "you", "your", or direct mentions refer to:
- If a message was sent by the current user (fromCurrentUser: true), look for commitments they made (e.g., "I will send the report").
- If a message was sent by someone else (fromCurrentUser: false), look for direct requests or assignments to the current user (e.g., "Can you check the logs?").`
    }
  }

  const payload = items.map(({ message, text }) => {
    const isFromCurrentUser = !!userProfile && (
      (!!message.from.email && message.from.email.toLowerCase() === userProfile.email?.toLowerCase()) ||
      (!!message.from.name && message.from.name.toLowerCase() === userProfile.name?.toLowerCase())
    )

    return {
      messageId: message.id,
      from: message.from.name,
      fromCurrentUser: isFromCurrentUser,
      when: message.createdDateTime,
      context: messageContext(message),
      body: text.slice(0, 1200),
    }
  })

  return `${EXTRACTION_SYSTEM}

${userContext}

Reference year for due dates: ${referenceYear} (use ${referenceYear + 1} if the date already passed this calendar year).

Messages to analyze:
${JSON.stringify(payload, null, 2)}

Return ONLY valid JSON:
{
  "results": [
    {
      "messageId": "<exact id from input>",
      "hasActionableItems": false,
      "confidence": 0.2,
      "reasoning": "One short sentence why no task or why tasks exist",
      "tasks": []
    }
  ]
}

Rules for output:
- Include exactly one result object per input messageId (same order as input is fine).
- confidence: 0.0–1.0 for your judgment on that message having actionable items
- Only set hasActionableItems: true when confidence >= ${MIN_MESSAGE_CONFIDENCE} and there is at least one real task
- tasks items: { "title", "description", "priority": "Low"|"Medium"|"High", "dueDate": "YYYY-MM-DD"|null, "confidence": 0.0-1.0 }`
}

type BatchAiResult = {
  messageId: string
  hasActionableItems?: boolean
  confidence?: number
  reasoning?: string
  tasks?: unknown[]
}

function parseBatchResponse(response: string): BatchAiResult[] {
  const parsed = parseJsonObject(response)
  if (parsed && Array.isArray(parsed.results)) {
    return parsed.results as BatchAiResult[]
  }

  const arr = parseJsonArray(response)
  if (arr.length > 0 && arr.every((r) => r && typeof r === "object" && "messageId" in (r as object))) {
    return arr as BatchAiResult[]
  }

  return []
}

/**
 * One LLM call per batch. No regex scoring or heuristic fallbacks — model decides everything.
 */
export async function extractTasksFromTeamsBatch(
  items: PreparedTeamsMessage[],
  userProfile?: { name: string | null; email: string | null } | null,
): Promise<Map<string, ExtractedTaskDraft[]>> {
  const byMessageId = new Map<string, ExtractedTaskDraft[]>()

  for (const item of items) {
    byMessageId.set(item.message.id, [])
  }

  if (items.length === 0) return byMessageId

  try {
    const response = await generateText(buildBatchPrompt(items, userProfile), {
      temperature: 0.1,
      maxTokens: Math.min(4096, 768 + items.length * 450),
      system: EXTRACTION_SYSTEM,
      responseMimeType: "application/json",
    })

    const results = parseBatchResponse(response)
    const itemById = new Map(items.map((i) => [i.message.id, i]))
    const seen = new Set<string>()

    for (const row of results) {
      const messageId = String(row.messageId ?? "").trim()
      const item = itemById.get(messageId)
      if (!item) continue

      seen.add(messageId)
      const confidence = typeof row.confidence === "number" ? row.confidence : 0

      if (row.hasActionableItems === true && Array.isArray(row.tasks) && confidence >= MIN_MESSAGE_CONFIDENCE) {
        const drafts = buildDraftsFromAiRows(item.message, item.text, row.tasks, confidence)
        byMessageId.set(messageId, drafts)
      }
    }

    // Unmentioned messageIds stay [] — no fallback
    for (const id of itemById.keys()) {
      if (!seen.has(id)) {
        console.warn(`⚠️ [Teams AI batch] No result for messageId ${id}`)
      }
    }
  } catch (error) {
    console.error(`❌ [Teams AI batch] ${items.length} messages:`, error)
  }

  return byMessageId
}
