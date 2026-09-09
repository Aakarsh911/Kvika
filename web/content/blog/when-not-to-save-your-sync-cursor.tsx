import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "when-not-to-save-your-sync-cursor",
  title: "When Not to Save Your Sync Cursor",
  description: "Saving Gmail historyId or Outlook deltaLink immediately after fetch loses data when AI or batch jobs fail mid-pipeline. Commit cursors after processing completes.",
  date: "2025-06-24",
  tags: ["sync","email","engineering","reliability","ai"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "mirror-vs-process",
      "title": "Mirror sync vs process-then-advance"
    },
    {
      "id": "failure",
      "title": "What failure looks like"
    },
    {
      "id": "pattern",
      "title": "The pattern that works"
    },
    {
      "id": "tradeoff",
      "title": "Tradeoffs"
    }
  ],
  content: () => (
    <article>
      <P>Saving Gmail historyId or Outlook deltaLink immediately after fetch loses data when AI or batch jobs fail mid-pipeline. Commit cursors after processing completes.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="mirror-vs-process">Mirror sync vs process-then-advance</H2>
      <P>Mirror sync copies provider state to your DB. Advance the cursor when fetch succeeds. That is correct for caches.</P>
      <P>Process-then-advance runs extraction, enrichment, or billing on each batch. Advance only when the batch commits. Mixing the two patterns causes silent data loss.</P>

      <H2 id="failure">What failure looks like</H2>
      <P>Fetch ten new emails. LLM times out on email seven. Cursor already saved. Those ten never re-enter the pipeline.</P>
      <P>Users see an empty task list and assume mail had nothing actionable. Support tickets follow.</P>

      <H2 id="pattern">The pattern that works</H2>
      <P>Fetch with persist=false on Outlook. Hold newGmailHistoryId in memory. Run extraction. Dedupe tasks by sourceId and title. Then persist both cursors in one step.</P>
      <P>If extraction throws, cursors stay put. Retry reprocesses the same mail; dedupe prevents duplicate tasks.</P>

      <H2 id="tradeoff">Tradeoffs</H2>
      <P>You may re-run LLM on overlap after failures. That costs tokens. Skipping mail costs trust.</P>
      <P>Make idempotency explicit in task creation, not just cursor storage.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/merging-gmail-and-outlook-in-one-inbox">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
