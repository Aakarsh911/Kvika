import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "extracting-tasks-from-teams-messages",
  title: "Extracting Tasks From Microsoft Teams Messages",
  description: "Pipeline: lookback window, HTML strip, batch LLM, dedupe by sourceId — turning chat noise into tracked work.",
  date: "2025-10-21",
  tags: ["microsoft-teams","ai","tasks","engineering"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "pipeline",
      "title": "Pipeline stages"
    },
    {
      "id": "hygiene",
      "title": "Hygiene vs classification"
    },
    {
      "id": "dedupe",
      "title": "Dedupe"
    }
  ],
  content: () => (
    <article>
      <P>Pipeline: lookback window, HTML strip, batch LLM, dedupe by sourceId — turning chat noise into tracked work.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="pipeline">Pipeline stages</H2>
      <P>Fetch messages (cap 40, 14-day lookback). prepareTeamsMessage strips HTML; skip empty/too_short.</P>
      <P>Batch to LLM (TEAMS_BATCH_SIZE). Persist tasks with source TEAMS and sourceId for idempotency.</P>

      <H2 id="hygiene">Hygiene vs classification</H2>
      <P>Do not regex-classify &#39;LGTM&#39; vs &#39;action item&#39; in code. Let LLM classify; code only drops empty bodies.</P>
      <P>Over-filtering in code removes context the model needs.</P>

      <H2 id="dedupe">Dedupe</H2>
      <P>findFirst on userId + source + sourceId before create. Re-runs after failed jobs skip duplicates.</P>
      <P>Stats: messagesScanned, skippedReasons, llmBatches — expose in API for UI transparency.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/wall-clock-meeting-times-from-llm-output">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
