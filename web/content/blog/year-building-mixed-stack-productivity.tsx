import type { BlogPost } from "@/lib/blog"
import { H2, H3, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "year-building-mixed-stack-productivity",
  title: "A Year of Building for Mixed Google and Microsoft Teams",
  description:
    "Incremental sync, process-then-advance cursors, name resolution without extra scopes, trace dedupe, and draft-then-confirm AI — themes from twelve months shipping a unified calendar, mail, and task workspace.",
  date: "2026-09-08",
  tags: ["product", "engineering", "productivity", "retrospective"],
  author: "Kvika Team",
  readTime: "8 min",
  sections: [
    { id: "default", title: "Mixed stack is the default" },
    { id: "sync", title: "Sync is the product" },
    { id: "ai", title: "AI as propose, not autopilot" },
    { id: "agent", title: "Agents need parsers, not prompts" },
    { id: "next", title: "What is still hard" },
  ],
  content: () => (
    <article>
      <P>
        A year ago our blog covered why scheduling breaks when half the team uses Google Calendar and
        half uses Outlook. We shipped unified mail, bidirectional calendar sync, AI task extraction,
        team scheduling, and a Bedrock agent on top — not as a demo stack, as daily-driver
        infrastructure with production footguns we wrote about each month.
      </P>
      <P>
        This post ties those threads together: what held up, what we would not skip again, and what
        is still unfinished.
      </P>

      <H2 id="default">Mixed stack is the default</H2>
      <P>
        Single-provider shortcuts become dead ends. Users connect Google and Microsoft in arbitrary
        combinations — work Outlook + personal Gmail, client tenant + company tenant, Teams without
        directory admin consent. Features must degrade gracefully: calendar-mined contacts when org
        search fails, partial inbox when one token expires, Teams scheduling when Google free/busy
        is not wired yet.
      </P>
      <P>
        Test matrix is four states: Google only, Microsoft only, both, neither. Provider badges in UI
        are not decoration — they explain which sync cursor failed.
      </P>

      <H2 id="sync">Sync is the product</H2>
      <P>
        Users forgive plain UI. They do not forgive missing meetings or mail that silently stops
        updating. The engineering depth lives in cursors, scoped deletes, conflict flags, and knowing
        when <em>not</em> to advance a bookmark until AI finishes (
        <A href="/blog/sync-cursors-and-ai-pipelines">process-then-advance</A>).
      </P>
      <P>
        Gmail <code>historyId</code> and Outlook <code>deltaLink</code> are different animals merged
        in one inbox (
        <A href="/blog/building-a-unified-gmail-outlook-inbox">unified inbox post</A>). Calendar pull/push
        needs <code>modifiedLocally</code> (
        <A href="/blog/bidirectional-calendar-sync-without-losing-edits">bidirectional sync</A>).
        Real-time mail layers push, SSE, and incremental fetch — not full re-download (
        <A href="/blog/realtime-mail-without-melting-api-quotas">real-time mail</A>).
      </P>
      <Callout type="tip">
        Incremental sync is day-one architecture, not a performance optimisation you add later.
      </Callout>

      <H2 id="ai">AI as propose, not autopilot</H2>
      <P>
        Task extraction batches mail conservatively, links every task to source threads, dedupes on
        retry, and requires explicit consent. Teams chat extraction biases false negatives. Analytics
        runs rule-based insights over existing rows — no metrics warehouse required (
        <A href="/blog/product-analytics-without-new-tables">analytics post</A>).
      </P>
      <P>
        Every outward-facing AI action is draft → human confirm: email, meeting, Jira. Autonomy comes
        after trust metrics, not before launch.
      </P>

      <H2 id="agent">Agents need parsers, not prompts</H2>
      <P>
        Bedrock agents call our Next.js API via Lambda bridges (
        <A href="/blog/bedrock-agents-calling-your-nextjs-api">architecture post</A>). Multi-tool turns
        need prompt reinforcement <em>and</em> trace fingerprint dedupe (
        <A href="/blog/deduplicating-bedrock-agent-trace-results">trace dedupe</A>,
        <A href="/blog/multi-tool-ai-agent-requests">multi-tool</A>). Name resolution runs server-side (
        <A href="/blog/resolving-colleagues-by-name-not-email">name resolution</A>). LLM datetimes need
        wall-clock handling (
        <A href="/blog/llm-meeting-times-without-timezone-bugs">timezone post</A>).
      </P>
      <P>
        Half our agent bugs were parsers and identity propagation, not model quality.
      </P>

      <H2 id="next">What is still hard</H2>
      <P>
        Calendar incremental tokens in the hot path — schema exists, full-window fetch still runs in
        production sync routes. Outlook delta pagination through entire first sync. Webhook subscription
        renewal mapped to users. Single-flight OAuth refresh everywhere. Conflict reconciliation UI
        beyond marking CONFLICT. Google free/busy in team scheduling alongside Microsoft.
      </P>
      <P>
        We document footguns honestly in these posts because the next team maintaining mixed-stack
        sync should not rediscover them from user trust cliffs.
      </P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Start anywhere:{" "}
        <A href="/blog/syncing-google-and-microsoft-calendars-programmatically">calendar sync primer</A>
        {" · "}
        <A href="/blog/stop-losing-action-items-in-your-inbox">inbox task capture</A>
        {" · "}
        <A href="/alternatives">compare tools</A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
