import { z } from "zod"

export const jiraTicketDraftInputSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(8000),
  priority: z.enum(["High", "Medium", "Low"]).optional(),
})

export type JiraTicketDraftInput = z.infer<typeof jiraTicketDraftInputSchema>

export function buildJiraTicketDraftAction(input: JiraTicketDraftInput) {
  const parsed = jiraTicketDraftInputSchema.parse(input)

  return {
    action: "show_jira_ticket_draft" as const,
    title: parsed.title.trim(),
    description: parsed.description.trim(),
    priority: parsed.priority ?? "Medium",
  }
}
