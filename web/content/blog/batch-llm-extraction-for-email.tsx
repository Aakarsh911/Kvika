import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "batch-llm-extraction-for-email",
  title: "Batch LLM Extraction for Email Tasks",
  description: "Why one API call for twenty emails beats twenty sequential calls — latency, cost, and context for cross-thread patterns.",
  date: "2025-10-28",
  tags: ["ai","email","engineering","gemini"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "batch",
      "title": "Batch size"
    },
    {
      "id": "context",
      "title": "Structured output"
    },
    {
      "id": "consent",
      "title": "Consent and rate limits"
    }
  ],
  content: () => (
    <article>
      <P>Why one API call for twenty emails beats twenty sequential calls — latency, cost, and context for cross-thread patterns.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="batch">Batch size</H2>
      <P>Chunk emails into batches of 20. Single extractTasksFromEmailsBatch call per chunk.</P>
      <P>Sequential per-email calls multiply cold start and rate limits.</P>

      <H2 id="context">Structured output</H2>
      <P>Return emailId, tasks[], confidence per message. Reject batches that throw before cursor persist.</P>
      <P>Log batch index / total for long runs — support can correlate timeouts.</P>

      <H2 id="consent">Consent and rate limits</H2>
      <P>requireAIConsent before any mail content leaves your VPC. checkRateLimit per user on extract endpoints.</P>
      <P>6/minute typical — enough for manual trigger, blocks abuse.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related reading:{" "}
        <A href="/blog/stop-losing-action-items-in-your-inbox">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
