import { z } from "zod"
import { generateText } from "@/lib/ai"

const toneMap = {
  professional: "professional and courteous",
  casual: "casual and friendly",
  friendly: "warm and friendly",
  formal: "formal and respectful",
} as const

export const replyEmailInputSchema = z.object({
  emailSubject: z.string().min(1),
  emailBody: z.string().min(1),
  from: z.object({
    name: z.string(),
    address: z.string(),
  }),
  tone: z.enum(["professional", "casual", "friendly", "formal"]).optional(),
  additionalInstructions: z.string().max(4000).optional(),
})

export type ReplyEmailInput = z.infer<typeof replyEmailInputSchema>

export async function generateReplyDraft(input: ReplyEmailInput): Promise<string> {
  const parsed = replyEmailInputSchema.parse(input)
  const toneKey = parsed.tone ?? "professional"
  const toneDescription = toneMap[toneKey]

  const prompt = `You are helping write an email reply. Generate a ${toneDescription} response to the following email.

Original Email:
From: ${parsed.from.name} <${parsed.from.address}>
Subject: ${parsed.emailSubject}
Body:
${parsed.emailBody}

${parsed.additionalInstructions ? `Additional instructions: ${parsed.additionalInstructions}\n` : ""}
Guidelines:
- Be ${toneDescription}
- Address the main points in the original email
- Keep it concise and clear
- Use proper email etiquette
- Do NOT include subject line or a "To:" line
- Start directly with the greeting (e.g., "Hi John,")
- End with an appropriate sign-off

Generate only the email body, nothing else:`

  return (await generateText(prompt, { temperature: 0.7, maxTokens: 1024 })).trim()
}
