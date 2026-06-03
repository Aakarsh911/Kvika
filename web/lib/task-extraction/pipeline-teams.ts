import type { PrismaClient } from "@prisma/client"

import { TEAMS_BATCH_SIZE, extractTasksFromTeamsBatch } from "./extract-teams-batch"
import { prepareTeamsMessage, type PreparedTeamsMessage } from "./prepare-teams-message"
import type { ExtractedTaskDraft, TeamsExtractionStats, TeamsMessageInput } from "./types"

const MAX_MESSAGES = 40
const LOOKBACK_DAYS = 14

function withinLookback(createdDateTime: string): boolean {
  const created = new Date(createdDateTime)
  if (Number.isNaN(created.getTime())) return true
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS)
  return created >= cutoff
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

export async function runTeamsExtractionPipeline(
  prisma: PrismaClient,
  userId: string,
  messages: TeamsMessageInput[],
): Promise<{ tasks: Awaited<ReturnType<PrismaClient["task"]["create"]>>[]; stats: TeamsExtractionStats }> {
  // Fetch user profile to pass current user context (name/email) to the AI extractor
  const userProfile = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  })
  const stats: TeamsExtractionStats = {
    messagesScanned: 0,
    messagesSkipped: 0,
    messagesActionable: 0,
    tasksExtracted: 0,
    tasksCreated: 0,
    duplicatesSkipped: 0,
    skippedReasons: {},
    llmBatches: 0,
  }

  const candidates = messages
    .filter((m) => withinLookback(m.createdDateTime))
    .slice(0, MAX_MESSAGES)

  stats.messagesScanned = candidates.length

  const prepared: PreparedTeamsMessage[] = []

  for (const message of candidates) {
    const result = prepareTeamsMessage(message)
    if (result.skipped) {
      stats.messagesSkipped += 1
      const reason = result.skipReason
      stats.skippedReasons[reason] = (stats.skippedReasons[reason] ?? 0) + 1
    } else {
      prepared.push(result.prepared)
    }
  }

  const allDrafts: ExtractedTaskDraft[] = []

  const batches = chunk(prepared, TEAMS_BATCH_SIZE)
  stats.llmBatches = batches.length

  for (const batch of batches) {
    const draftsByMessage = await extractTasksFromTeamsBatch(batch, userProfile)

    for (const [, drafts] of draftsByMessage) {
      if (drafts.length > 0) {
        stats.messagesActionable += 1
        allDrafts.push(...drafts)
      }
    }
  }

  stats.tasksExtracted = allDrafts.length

  const createdTasks = []

  for (const draft of allDrafts) {
    const existing = await prisma.task.findFirst({
      where: {
        userId,
        source: "TEAMS",
        sourceId: draft.sourceId,
      },
    })

    if (existing) {
      stats.duplicatesSkipped += 1
      continue
    }

    try {
      const task = await prisma.task.create({
        data: {
          userId,
          title: draft.title,
          description: draft.description,
          status: "To Do",
          priority: draft.priority,
          dueDate: draft.dueDate ? new Date(draft.dueDate) : null,
          source: "TEAMS",
          sourceId: draft.sourceId,
          url: draft.url ?? null,
          sourceData: {
            ...draft.sourceData,
            confidence: draft.confidence,
            extractionMethod: draft.extractionMethod,
            extractedAt: new Date().toISOString(),
          },
        },
      })
      createdTasks.push(task)
      stats.tasksCreated += 1
    } catch (error) {
      console.error(`❌ Failed to persist Teams task ${draft.sourceId}:`, error)
    }
  }

  return { tasks: createdTasks, stats }
}
