type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type SelectedEmail = {
  id: string
  subject: string
  from: { name: string; address: string }
  provider: "gmail" | "outlook"
  bodyPreview: string
}

export function buildAgentRuntimePrompt(params: {
  messages: ChatMessage[]
  selectedEmail?: SelectedEmail | null
  userEmail: string
}) {
  const recentMessages = params.messages.slice(-8)
  const conversation = recentMessages.map((message) => `${message.role}: ${message.content}`).join("\n")

  const selectedEmailContext = params.selectedEmail
    ? `\nCurrent email in context:
- Subject: ${params.selectedEmail.subject}
- From: ${params.selectedEmail.from.name} <${params.selectedEmail.from.address}>
- ID: ${params.selectedEmail.id}
- Provider: ${params.selectedEmail.provider}
- Preview: ${params.selectedEmail.bodyPreview}`
    : ""

  return `You are ChronoFlow's AI assistant for ${params.userEmail}.

Runtime rules:
- Email tools are draft-only. Never send email.
- For compose_new_email, ask for the recipient if missing before calling the tool.
- For reply_to_email, use the email ID and provider from context. If no email is in context, ask the user to select one first.
- For create_jira_ticket, collect title and description before calling the tool. The user will choose the Jira project in ChronoFlow before the ticket is created.
- After a tool succeeds, return ONLY JSON with this shape and no markdown:
{"message":"Short user-facing summary","clientAction":{...}}
- Valid clientAction types:
  - {"type":"show_new_email_draft","to":"recipient@example.com","subject":"Subject","body":"Email body","provider":"gmail"}
  - {"type":"show_email_reply_draft","emailId":"...","provider":"gmail","subject":"...","body":"Reply body"}
  - {"type":"show_jira_ticket_draft","title":"...","description":"...","priority":"Medium"}
- For normal conversation, answer naturally without JSON.

Conversation:
${conversation}${selectedEmailContext}`
}
