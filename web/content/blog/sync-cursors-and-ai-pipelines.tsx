import type { BlogPost } from "@/lib/blog"
import { Codeblock, H2, H3, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "sync-cursors-and-ai-pipelines",
  title: "Sync Cursors and AI Pipelines: When to Advance the Bookmark",
  description:
    "Saving Gmail historyId or Outlook deltaLink right after fetch loses mail when LLM extraction fails mid-run. Process-then-advance is a different contract than mirror sync.",
  date: "2025-07-15",
  tags: ["email", "ai", "engineering", "sync", "reliability"],
  author: "Kvika Team",
  readTime: "7 min",
  sections: [
    { id: "two-patterns", title: "Mirror sync vs process-then-advance" },
    { id: "failure", title: "The silent data loss bug" },
    { id: "solution", title: "persist=false and deferred commit" },
    { id: "idempotency", title: "Retries without duplicate tasks" },
    { id: "tradeoffs", title: "What you pay for this" },
  ],
  content: () => (
    <article>
      <P>
        Incremental mail sync has a simple rule: fetch changes, apply them, save the cursor. Every
        engineer building on Gmail or Microsoft Graph learns that pattern on day one. It is correct
        when your job is to mirror provider state into a cache or database.
      </P>
      <P>
        It is wrong when something expensive sits between fetch and save — like an LLM that extracts
        tasks from each batch. We learned this after users reported empty task lists on weeks that
        clearly had actionable mail. The inbox had moved on. The extraction pipeline never got a
        second chance.
      </P>

      <H2 id="two-patterns">Mirror sync vs process-then-advance</H2>
      <P>
        <strong>Mirror sync:</strong> the cursor advances when the fetch succeeds. Gmail historyId
        updates, Outlook deltaLink updates, done. Correct for live inbox views where displaying mail
        is the end goal.
      </P>
      <P>
        <strong>Process-then-advance:</strong> the cursor advances only when downstream processing
        commits. Fetch is step one. Extract tasks, enrich, bill, index — whatever your pipeline does
        — is step two. Step three persists the cursor. If step two throws, the cursor stays put.
      </P>
      <Callout type="info">
        Mixing these patterns in one code path causes silent data loss. The inbox UI can use
        mirror sync; the task extraction job must use process-then-advance.
      </Callout>

      <H2 id="failure">The silent data loss bug</H2>
      <P>
        Here is the failure mode we hit. Task extraction pulls ten new emails via incremental sync.
        It stores the new Gmail historyId immediately. Gemini times out on email seven. The API
        returns 500. Those ten emails never re-enter the extraction queue — the cursor already
        advanced past them.
      </P>
      <P>
        From the user&apos;s perspective: mail arrived, nothing became a task, no error surfaced in
        the UI. Support tickets described it as &quot;AI missed my email&quot; when the model never
        saw a retry.
      </P>
      <P>
        Outlook had the same shape. Our delta route persisted <code>outlookMailDeltaLink</code> on
        every successful fetch. A crash after fetch but before task creation had identical
        consequences.
      </P>

      <H2 id="solution">persist=false and deferred commit</H2>
      <P>
        The fix has two parts. First, fetch Outlook deltas with{" "}
        <code>persist=false</code> so the route returns a new <code>deltaLink</code> in the JSON
        response but does not write it to the integration row. Hold{" "}
        <code>newGmailHistoryId</code> and <code>newOutlookDeltaLink</code> in memory through the
        whole pipeline.
      </P>
      <P>
        Second, only after all LLM batches succeed and tasks are persisted, commit both cursors in
        one step:
      </P>
      <Codeblock language="typescript">{`// ONLY after all Gemini batches complete without throwing:

if (googleIntegration && newGmailHistoryId !== gmailHistoryId) {
  await prisma.integration.update({
    where: { id: googleIntegration.id },
    data: { data: { ...data, gmailHistoryId: newGmailHistoryId } },
  })
}

if (microsoftIntegration && newOutlookDeltaLink !== storedDeltaLink) {
  await prisma.integration.update({
    where: { id: microsoftIntegration.id },
    data: { data: { ...data, outlookMailDeltaLink: newOutlookDeltaLink } },
  })
}`}</Codeblock>
      <P>
        If any batch throws, the catch block returns 500 and cursors remain unchanged. The next
        run re-processes the same mail. That is intentional.
      </P>

      <H2 id="idempotency">Retries without duplicate tasks</H2>
      <P>
        At-least-once processing requires idempotent writes. Before creating a task from an email,
        we check for an existing row matching <code>userId</code>, <code>source: EMAIL_AI</code>,{" "}
        <code>sourceId</code> (the email ID), and <code>title</code>:
      </P>
      <Codeblock language="typescript">{`const existing = await prisma.task.findFirst({
  where: {
    userId: user.id,
    source: 'EMAIL_AI',
    sourceId: result.emailId,
    title: task.title,
  },
})
if (existing) continue // safe retry`}</Codeblock>
      <P>
        Re-running extraction after a failure may cost extra LLM tokens. Skipping mail permanently
        costs user trust. We chose tokens.
      </P>
      <H3>Batch sizing</H3>
      <P>
        Emails are chunked into batches of ten for a single <code>extractTasksFromEmailsBatch</code>{" "}
        call. We use temporary IDs (<code>email_1</code>, <code>email_2</code>) in the prompt so
        the model does not corrupt opaque Gmail/Outlook message IDs, then map results back to real
        IDs before persistence.
      </P>

      <H2 id="tradeoffs">What you pay for this</H2>
      <P>
        <strong>Duplicate LLM work on retry.</strong> Acceptable. Token cost is visible in logs;
        lost mail is not.
      </P>
      <P>
        <strong>Consent and rate limits gate the pipeline.</strong> Extraction requires explicit AI
        consent and is limited to six runs per minute per user. A rejected consent check fails
        before fetch — cursors never advance, which is correct.
      </P>
      <P>
        <strong>Two cursor owners.</strong> The live inbox dashboard may advance cursors on its
        own schedule. Task extraction owns <code>gmailHistoryId</code> for its job. Document which
        subsystem writes which key or you will debug phantom full re-fetches for months.
      </P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related:{" "}
        <A href="/blog/building-a-unified-gmail-outlook-inbox">unified inbox incremental sync</A>
        {" · "}
        <A href="/blog/batch-ai-task-extraction-from-email">batch LLM extraction details</A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
