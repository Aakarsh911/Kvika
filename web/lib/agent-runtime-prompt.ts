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

Recipient resolution:
- If the user names someone without an email address, pass that name as "to" in compose_new_email.
- Do NOT ask for an email address when the user already gave a name. ChronoFlow resolves names automatically.`
}
