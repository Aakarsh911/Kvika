/** Remove model chain-of-thought blocks that must never be shown to users. */
export function sanitizeAgentText(text: string) {
  return text
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
    .trim()
}
