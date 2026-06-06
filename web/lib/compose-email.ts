import { z } from "zod"
import { generateText } from "@/lib/ai"

const toneMap = {
  professional: "professional and courteous",
  casual: "casual and friendly",
  friendly: "warm and friendly",
  formal: "formal and respectful",
} as const

export const composeEmailInputSchema = z.object({
  to: z.string().email().optional().or(z.literal("")),
  subject: z.string().max(200).optional().or(z.literal("")),
  context: z.string().min(1, "Context is required").max(8000),
  tone: z.enum(["professional", "casual", "friendly", "formal"]).optional(),
})

export type ComposeEmailInput = z.infer<typeof composeEmailInputSchema>

export interface ComposeEmailDraft {
  to?: string
  subject: string
  body: string
  tone: keyof typeof toneMap
}

export async function composeEmailDraft(input: ComposeEmailInput): Promise<ComposeEmailDraft> {
  const parsed = composeEmailInputSchema.parse(input)
  const toneKey = parsed.tone ?? "professional"
  const toneDescription = toneMap[toneKey]

  const prompt = `You are helping compose a new email. Generate a ${toneDescription} email based on the following information:

${parsed.to ? `To: ${parsed.to}` : ""}
${parsed.subject ? `Subject: ${parsed.subject}` : ""}

Context/Instructions: ${parsed.context}

Guidelines:
- Be ${toneDescription}
- Keep it concise and clear
- Use proper email etiquette
- Start with an appropriate greeting
- End with a professional sign-off
- Do NOT include "To:" or "Subject:" in the body
- Just provide the email body content

Generate only the email body:`

  const body = (await generateText(prompt, { temperature: 0.7, maxTokens: 1024 })).trim()

  let generatedSubject = parsed.subject
  if (!generatedSubject && parsed.to) {
    const subjectPrompt = `Generate a short, professional email subject line (max 60 characters) for an email about: ${parsed.context}

Return ONLY the subject line, no quotes or explanations.`

    generatedSubject = (await generateText(subjectPrompt, { temperature: 0.7, maxTokens: 128 }))
      .trim()
      .replace(/['"]/g, "")
  }

  return {
    to: parsed.to || undefined,
    subject: generatedSubject || "Follow up",
    body,
    tone: toneKey,
  }
}
