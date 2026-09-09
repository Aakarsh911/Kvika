import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "gmail-historyid-incremental-sync",
  title: "Gmail historyId: Incremental Sync Without Re-fetching Your Inbox",
  description: "How Gmail's history API tracks messageAdded, messageDeleted, and label changes — and why it beats full inbox pulls for live mail views.",
  date: "2025-06-03",
  tags: ["gmail","email","engineering","sync","api"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "why-full-fetch-fails",
      "title": "Why full inbox fetches do not scale"
    },
    {
      "id": "history-types",
      "title": "The history types that matter"
    },
    {
      "id": "footguns",
      "title": "Footguns in production"
    },
    {
      "id": "client-merge",
      "title": "Merging deltas on the client"
    }
  ],
  content: () => (
    <article>
      <P>How Gmail&#39;s history API tracks messageAdded, messageDeleted, and label changes — and why it beats full inbox pulls for live mail views.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="why-full-fetch-fails">Why full inbox fetches do not scale</H2>
      <P>Pulling every message on each page load works for prototypes. It breaks the moment users have thousands of threads, multiple tabs open, or a webhook that fires every few minutes.</P>
      <P>Gmail exposes incremental change tracking through historyId. Each mailbox state has a monotonic ID. Ask for changes since your last ID and you receive only what moved: new mail, deletions, label updates.</P>

      <H2 id="history-types">The history types that matter</H2>
      <P>messageAdded and messageDeleted are obvious. labelAdded and labelRemoved matter too: marking read/unread or starring a message is a change your UI should reflect without re-downloading bodies.</P>
      <P>Collect changed message IDs into a set, fetch details in parallel, and return deletions separately so the client can remove them from local state.</P>

      <H2 id="footguns">Footguns in production</H2>
      <P>historyId expires. Google may return 400 if you have not synced in too long. Catch that, fall back to a bounded full fetch, and store a fresh historyId.</P>
      <P>History can paginate. Large bursts (label sync, import) may span pages. Loop until historyId stabilises or you hit a safety cap.</P>

      <H2 id="client-merge">Merging deltas on the client</H2>
      <P>Treat your in-memory list as a map keyed by message ID. Apply upserts for changed IDs, delete keys for removed IDs, re-sort by received time. Full replace is simpler but flickers on large inboxes.</P>
      <P>Persist historyId in integration metadata for server jobs; keep a copy in client state for interactive dashboards that poll or listen over SSE.</P>

      <Callout type="tip">Invalidate your mail cache whenever validEmails.length &gt; 0 or deletedMessageIds.size &gt; 0. Partial updates still change what users see.</Callout>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/syncing-google-and-microsoft-calendars-programmatically">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
