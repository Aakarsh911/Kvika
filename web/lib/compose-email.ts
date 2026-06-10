import { z } from "zod"
import { generateText } from "@/lib/ai"
import { resolveAttendees } from "@/lib/teams-directory"

const toneMap = {
  professional: "professional and courteous",
  casual: "casual and friendly",
  friendly: "warm and friendly",
  formal: "formal and respectful",
} as const

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const composeEmailInputSchema = z.object({
  userEmail: z.string().email().optional(),
  to: z.string().min(1).max(200).optional().or(z.literal("")),
  subject: z.string().max(200).optional().or(z.literal("")),
  context: z.string().min(1, "Context is required").max(8000),
  tone: z.enum(["professional", "casual", "friendly", "formal"]).optional(),
})

export type ComposeEmailInput = z.infer<typeof composeEmailInputSchema>

export interface ComposeEmailDraft {
  to?: string
  toName?: string
  recipientMatched: boolean
  subject: string
  body: string
  tone: keyof typeof toneMap
}

async function resolveRecipient(userEmail: string | undefined, rawTo: string) {
  const trimmed = rawTo.trim()
  if (!trimmed) {
    return { email: undefined, name: undefined, matched: false }
  }

  if (EMAIL_REGEX.test(trimmed)) {
    return { email: trimmed, name: trimmed, matched: true }
  }

  if (!userEmail) {
    return { email: undefined, name: trimmed, matched: false }
  }

  const [resolved] = await resolveAttendees(userEmail, [trimmed])
  if (resolved?.email) {
    return { email: resolved.email, name: resolved.name, matched: true }
  }

  return { email: undefined, name: trimmed, matched: false }
}

export async function composeEmailDraft(input: ComposeEmailInput): Promise<ComposeEmailDraft> {
  const parsed = composeEmailInputSchema.parse(input)
  const toneKey = parsed.tone ?? "professional"
  const toneDescription = toneMap[toneKey]

  const recipient = parsed.to ? await resolveRecipient(parsed.userEmail, parsed.to) : null
  const greetingName = recipient?.name && recipient.name !== recipient.email ? recipient.name : recipient?.email

  const prompt = `You are helping compose a new email. Generate a ${toneDescription} email based on the following information:

${greetingName ? `To: ${greetingName}` : ""}
${parsed.subject ? `Subject: ${parsed.subject}` : ""}

Context/Instructions: ${parsed.context}

Guidelines:
- Be ${toneDescription}
- Keep it concise and clear
- Use proper email etiquette
- Start with an appropriate greeting${greetingName ? ` addressing ${greetingName}` : ""}
- End with a professional sign-off
- Do NOT include "To:" or "Subject:" in the body
- Just provide the email body content

Generate only the email body:`

  const body = (await generateText(prompt, { temperature: 0.7, maxTokens: 1024 })).trim()

  let generatedSubject = parsed.subject
  if (!generatedSubject && (recipient?.email || parsed.to)) {
    const subjectPrompt = `Generate a short, professional email subject line (max 60 characters) for an email about: ${parsed.context}

Return ONLY the subject line, no quotes or explanations.`

    generatedSubject = (await generateText(subjectPrompt, { temperature: 0.7, maxTokens: 128 }))
      .trim()
      .replace(/['"]/g, "")
  }

  return {
    to: recipient?.email,
    toName: recipient?.name ?? parsed.to,
    recipientMatched: recipient?.matched ?? false,
    subject: generatedSubject || "Follow up",
    body,
    tone: toneKey,
  }
}
