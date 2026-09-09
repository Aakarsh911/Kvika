import type { BlogPost } from "@/lib/blog"
import { Codeblock, H2, H3, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "extracting-tasks-from-teams-chat",
  title: "Extracting Tasks From Teams Chat Without Drowning in Noise",
  description:
    "HTML strip in code, classification in the LLM, batch size eight, 14-day lookback — a Teams pipeline designed for false negatives over invented tasks.",
  date: "2026-03-15",
  tags: ["microsoft-teams", "ai", "tasks", "engineering"],
  author: "Kvika Team",
  readTime: "7 min",
  sections: [
    { id: "noise", title: "Chat is not a task queue" },
    { id: "hygiene", title: "Hygiene in code, judgment in the model" },
    { id: "pipeline", title: "Pipeline stages" },
    { id: "dedupe", title: "Dedupe by message ID" },
    { id: "contrast", title: "Teams vs email extraction" },
  ],
  content: () => (
    <article>
      <P>
        Teams messages mix action items, status updates, jokes, and &quot;LGTM&quot; replies. Treating
        every message as a task source creates garbage. Ignoring Teams creates the same leak as email
        — commitments that never reach Jira or a task list.
      </P>
      <P>
        Our Teams extraction pipeline scans recent messages, strips HTML noise in code, batches the
        remainder to the LLM, and persists tasks with stable source IDs. The design bias is false
        negatives over invented work.
      </P>

      <H2 id="noise">Chat is not a task queue</H2>
      <P>
        Unlike email, chat lacks subject lines and explicit threading hierarchy. Context lives in
        replies, @mentions, and channel names. Extraction needs message metadata — team, channel,
        author, timestamp — in the prompt so the model knows who owes whom what.
      </P>

      <H2 id="hygiene">Hygiene in code, judgment in the model</H2>
      <P>
        <code>prepareTeamsMessage</code> strips HTML and drops empty or ultra-short bodies (under
        three characters). We deliberately do <em>not</em> regex-classify &quot;LGTM&quot; vs
        &quot;please review&quot; in TypeScript — that becomes a maintenance nightmare. The LLM
        decides actionability; code only removes unusable input.
      </P>
      <Callout type="info">
        Prompt instruction: false negatives are better than inventing tasks. Match the conservative
        posture of email extraction.
      </Callout>

      <H2 id="pipeline">Pipeline stages</H2>
      <P>
        <strong>1. Filter.</strong> Max 40 messages, 14-day lookback. Older chat is stale for task
        capture.
      </P>
      <P>
        <strong>2. Prepare.</strong> Strip HTML, collect skip reasons for stats (
        <code>empty</code>, <code>too_short</code>).
      </P>
      <P>
        <strong>3. Batch LLM.</strong> Chunks of eight messages per call. Include user profile
        (name, email) so the model knows who &quot;you&quot; is versus assignees.
      </P>
      <P>
        <strong>4. Persist.</strong> Create tasks with <code>source: TEAMS</code>,{" "}
        <code>sourceId</code> from message identity, <code>sourceData</code> with confidence and
        extraction method.
      </P>
      <Codeblock language="typescript">{`const stats = {
  messagesScanned, messagesSkipped, messagesActionable,
  tasksExtracted, tasksCreated, duplicatesSkipped,
  skippedReasons: { empty: 2, too_short: 5 },
  llmBatches: 4,
}`}</Codeblock>
      <P>
        Expose stats in the API response so the UI can toast &quot;3 tasks from 12 messages, 8
        skipped as noise.&quot;
      </P>

      <H2 id="dedupe">Dedupe by message ID</H2>
      <P>
        Teams dedupe checks <code>userId + source TEAMS + sourceId</code> only — one task row per
        message ID on retry. Unlike email, we do not also match title; one message should not spawn
        duplicate rows on pipeline re-run.
      </P>

      <H2 id="contrast">Teams vs email extraction</H2>
      <P>
        Email uses temp IDs in batch prompts and title-based dedupe within the same message. Teams
        uses native message IDs directly. Email defers sync cursors; Teams ingestion is separate from
        mail sync entirely.
      </P>
      <P>
        Both require AI consent and rate limiting. Both link tasks back to source context — Teams
        stores team/channel in <code>sourceData</code> for display even when deep links are
        imperfect.
      </P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related:{" "}
        <A href="/blog/batch-ai-task-extraction-from-email">email extraction pipeline</A>
        {" · "}
        <A href="/blog/stop-losing-action-items-in-your-inbox">inbox task capture</A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
