type SelectedEmail = {
  id: string
  subject: string
  from: { name: string; address: string }
  provider: "gmail" | "outlook"
  bodyPreview: string
}

/**
 * Send only the latest user turn to the agent.
 * Bedrock session memory retains prior conversation across follow-ups.
 */
export function buildAgentRuntimePrompt(params: {
  lastUserMessage: string
  selectedEmail?: SelectedEmail | null
  timeZone?: string | null
  currentTime?: string | null
}) {
  const selectedEmailContext = params.selectedEmail
    ? `

Selected email in ChronoFlow UI:
- emailId: ${params.selectedEmail.id}
- provider: ${params.selectedEmail.provider}
- subject: ${params.selectedEmail.subject}
- from: ${params.selectedEmail.from.name} <${params.selectedEmail.from.address}>`
    : ""

  const timeContext = params.timeZone
    ? `

User time context:
- timeZone: ${params.timeZone}
- currentTime: ${params.currentTime || new Date().toISOString()}
Interpret natural dates and times in this time zone unless the user says otherwise.`
    : ""

  return `${params.lastUserMessage.trim()}${selectedEmailContext}${timeContext}

Tool orchestration:
- If the user asks for multiple actions in one message, call every required tool before your final reply.
- Do not stop after the first tool — ChronoFlow renders each tool result as a separate draft card.
- Pass people by name when the user only gave a name; ChronoFlow resolves names to email addresses.`
}
