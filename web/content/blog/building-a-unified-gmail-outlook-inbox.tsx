import type { BlogPost } from "@/lib/blog"
import { Codeblock, H2, H3, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "building-a-unified-gmail-outlook-inbox",
  title: "Building a Unified Gmail + Outlook Inbox",
  description:
    "Gmail uses historyId. Outlook uses deltaLink. Two JSON shapes, two deletion semantics — how we merge both into one live inbox without re-fetching everything on every refresh.",
  date: "2025-06-15",
  tags: ["email", "gmail", "microsoft-outlook", "engineering", "sync"],
  author: "Kvika Team",
  readTime: "8 min",
  sections: [
    { id: "problem", title: "Two inboxes, one screen" },
    { id: "gmail", title: "Gmail: history.list, not messages.list" },
    { id: "outlook", title: "Outlook: delta queries on mail" },
    { id: "merge", title: "Merging upserts and deletions" },
    { id: "footguns", title: "What broke in production" },
  ],
  content: () => (
    <article>
      <P>
        Engineers on mixed stacks do not want two browser tabs for mail. They want one unread count,
        one search, one place to triage. That sounds like a UI problem until you try to keep Gmail
        and Outlook accurate without pulling thousands of messages every time someone switches tabs.
      </P>
      <P>
        At Kvika we unified both providers behind one dashboard. The hard part is not rendering a
        combined list — it is incremental sync: Gmail tracks changes with a monotonic{" "}
        <code>historyId</code>, Microsoft Graph hands you an <code>@odata.deltaLink</code>, and
        the two APIs disagree on what a &quot;change&quot; even looks like. This post walks through
        the architecture we landed on.
      </P>

      <H2 id="problem">Two inboxes, one screen</H2>
      <P>
        A naïve unified inbox fetches all Gmail threads, fetches all Outlook messages, concatenates,
        sorts by date. That works in a demo. In production it means slow loads, rate limits, and
        stale data the moment a webhook fires.
      </P>
      <P>
        The correct model is the same one you use for calendar sync: maintain a cursor per provider,
        fetch only deltas, merge into client state. Gmail and Outlook cursors are stored separately
        on the user&apos;s integration record — <code>gmailHistoryId</code> and{" "}
        <code>outlookMailDeltaLink</code> — and advanced independently.
      </P>
      <Callout type="tip">
        Treat provider cursors as independent streams. Never assume Gmail and Outlook advance on
        the same schedule.
      </Callout>

      <H2 id="gmail">Gmail: history.list, not messages.list</H2>
      <P>
        Gmail&apos;s incremental API is <code>users.history.list</code>. You pass your last{" "}
        <code>startHistoryId</code> and receive a list of history records — not full messages. Each
        record may contain <code>messagesAdded</code>, <code>messagesDeleted</code>,{" "}
        <code>labelsAdded</code>, or <code>labelsRemoved</code>.
      </P>
      <P>
        That last pair matters more than people expect. Marking a thread read/unread or starring it
        is a label change. If you only listen for <code>messageAdded</code>, your unread badge drifts
        until the next full refresh.
      </P>
      <Codeblock language="typescript">{`// Collect changed IDs from history records
const changedIds = new Set<string>()
const deletedIds = new Set<string>()

for (const record of history) {
  record.messagesAdded?.forEach(m => changedIds.add(m.message!.id!))
  record.messagesDeleted?.forEach(m => deletedIds.add(m.message!.id!))
  record.labelsAdded?.forEach(m => changedIds.add(m.message!.id!))
  record.labelsRemoved?.forEach(m => changedIds.add(m.message!.id!))
}

// Fetch full message only for changed IDs
const emails = await Promise.all(
  [...changedIds].map(id => gmail.users.messages.get({ userId: 'me', id, format: 'full' }))
)

return { emails, deleted: [...deletedIds], historyId: newHistoryId }`}</Codeblock>
      <H3>historyId expiry</H3>
      <P>
        Gmail history IDs expire. If the user has not synced in a while, <code>history.list</code>{" "}
        returns 400. Catch that, fall back to a bounded full fetch (we scope initial loads to
        today&apos;s inbox), and store a fresh <code>historyId</code> from the profile or watch
        response. Without this fallback, returning users see a frozen inbox.
      </P>

      <H2 id="outlook">Outlook: delta queries on mail</H2>
      <P>
        Microsoft Graph mail sync uses delta queries. The first call hits an endpoint like{" "}
        <code>/me/mailFolders(&apos;inbox&apos;)/messages/delta</code> with a filter — we use
        today&apos;s received time as the initial window. Graph returns changed items plus either{" "}
        <code>@odata.nextLink</code> (more pages) or <code>@odata.deltaLink</code> (sync complete).
      </P>
      <P>
        On subsequent runs you call the stored <code>deltaLink</code> URL directly. You get upserts
        since the last run. Outlook does not give you explicit deletions the same way Gmail does in
        every case — your merge layer treats delta results as upserts and relies on separate delete
        semantics where Graph marks removals.
      </P>
      <P>
        We persist <code>outlookMailDeltaLink</code> on the Microsoft integration row. The delta
        route supports <code>deltaLink=clear</code> to wipe state when tokens rot, and{" "}
        <code>persist=false</code> to fetch a new cursor without writing it yet — important for
        downstream pipelines that we cover in a later post.
      </P>
      <Callout type="info">
        Pagination footgun: <code>@odata.deltaLink</code> often appears only on the last page. If
        you stop at page one on a busy inbox, you truncate mail and store a cursor that thinks you
        are caught up.
      </Callout>

      <H2 id="merge">Merging upserts and deletions</H2>
      <P>
        The unified dashboard keeps React state as a list but merges incrementally via a{" "}
        <code>Map</code> keyed by message ID:
      </P>
      <Codeblock language="typescript">{`// Incremental merge in the client
const emailMap = new Map(prevEmails.map(e => [e.id, e]))

gmailData.emails.forEach(e => emailMap.set(e.id, { ...e, provider: 'gmail' }))
gmailData.deleted?.forEach(id => emailMap.delete(id))
outlookData.emails.forEach(e => emailMap.set(e.id, e))

return [...emailMap.values()].sort(
  (a, b) => new Date(b.receivedDateTime).getTime() - new Date(a.receivedDateTime).getTime()
)`}</Codeblock>
      <P>
        On first load or explicit force refresh, replace the list entirely. On incremental passes
        — triggered by polling, SSE, or user action — patch in place so scroll position and read
        state do not flicker.
      </P>
      <P>
        Normalise both providers to one shape before merge: <code>id</code>, <code>subject</code>,{" "}
        <code>from</code> (name + address), <code>receivedDateTime</code>, <code>provider</code>,{" "}
        <code>webLink</code>. Gmail gives you <code>snippet</code> and <code>labelIds</code>; Graph
        gives <code>bodyPreview</code> and <code>isRead</code>. Map both to the same fields.
      </P>

      <H2 id="footguns">What broke in production</H2>
      <P>
        <strong>Cursor key schizophrenia.</strong> Gmail watch setup stored{" "}
        <code>historyId</code> under one integration key; task extraction read{" "}
        <code>gmailHistoryId</code> under another. Symptoms looked like random full re-fetches.
        Align keys or document which subsystem owns which cursor.
      </P>
      <P>
        <strong>forceRefresh on every push notification.</strong> Webhooks should nudge an
        incremental merge. Calling full fetch on every SSE event discards cursor savings and hammers
        APIs during label-sync bursts.
      </P>
      <P>
        <strong>Parallel fetch with silent partial failure.</strong> We fetch Gmail and Outlook in
        parallel. If one provider&apos;s token expired, show partial results and a reconnect prompt
        for the failing side — not an empty inbox.
      </P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Next:{" "}
        <A href="/blog/sync-cursors-and-ai-pipelines">
          why we do not save sync cursors until AI extraction finishes
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
