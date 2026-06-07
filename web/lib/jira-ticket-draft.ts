import { z } from "zod"
import { generateText } from "@/lib/ai"

export const jiraTicketDraftInputSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(8000).optional(),
  priority: z.enum(["High", "Medium", "Low"]).optional(),
  context: z.string().max(4000).optional(),
})

export type JiraTicketDraftInput = z.infer<typeof jiraTicketDraftInputSchema>

export async function generateJiraDescription(title: string, context?: string) {
  const prompt = [
    `Write a concise Jira ticket description for: "${title}"`,
    context ? `User context: ${context}` : "",
    "",
    "Use markdown with ## Summary and ## Details sections.",
    "Return only the description body.",
  ]
    .filter(Boolean)
    .join("\n")

  return (await generateText(prompt, { temperature: 0.5, maxTokens: 512 })).trim()
}

export async function resolveJiraTicketDraft(input: JiraTicketDraftInput) {
  const parsed = jiraTicketDraftInputSchema.parse(input)
  const description =
    parsed.description?.trim() ||
    (await generateJiraDescription(parsed.title, parsed.context))

  return buildJiraTicketDraftAction({
    title: parsed.title,
    description,
    priority: parsed.priority,
  })
}

export function buildJiraTicketDraftAction(input: {
  title: string
  description: string
  priority?: "High" | "Medium" | "Low"
}) {
  return {
    action: "show_jira_ticket_draft" as const,
    title: input.title.trim(),
    description: input.description.trim(),
    priority: input.priority ?? "Medium",
  }
}
