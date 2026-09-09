import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "deduping-ai-extracted-tasks",
  title: "Deduping AI-Extracted Tasks Without Losing Legitimate Overlap",
  description: "Composite key on sourceId + title for EMAIL_AI — handling retries after cursor deferral and duplicate suggestions.",
  date: "2025-11-04",
  tags: ["ai","tasks","email","engineering","reliability"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "key",
      "title": "Dedupe key"
    },
    {
      "id": "retry",
      "title": "Retries"
    },
    {
      "id": "teams",
      "title": "Teams source"
    }
  ],
  content: () => (
    <article>
      <P>Composite key on sourceId + title for EMAIL_AI — handling retries after cursor deferral and duplicate suggestions.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="key">Dedupe key</H2>
      <P>Same email can suggest &#39;Review PR&#39; twice if LLM re-runs — match userId, source EMAIL_AI, sourceId emailId, title.</P>
      <P>Two different tasks from one email need different titles — model prompt should separate them.</P>

      <H2 id="retry">Retries</H2>
      <P>Deferred sync cursors mean re-processing overlap. Dedupe makes at-least-once safe.</P>
      <P>Log skippedDuplicates count in API response for UI toast.</P>

      <H2 id="teams">Teams source</H2>
      <P>TEAMS dedupe on sourceId only — one message maps to multiple tasks with distinct sourceId suffixes in draft.</P>
      <P>Align id generation in normalise layer.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/batch-llm-extraction-for-email">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
