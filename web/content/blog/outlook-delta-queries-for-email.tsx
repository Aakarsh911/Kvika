import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "outlook-delta-queries-for-email",
  title: "Outlook Delta Queries: Incremental Mail Sync on Microsoft Graph",
  description: "Microsoft Graph delta links work differently from Gmail historyId. Here is how to fetch only changed messages and persist the cursor safely.",
  date: "2025-06-10",
  tags: ["microsoft-outlook","email","engineering","graph-api","sync"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "delta-basics",
      "title": "How delta links work"
    },
    {
      "id": "persist",
      "title": "Where to store the cursor"
    },
    {
      "id": "persist-false",
      "title": "Fetch now, persist later"
    },
    {
      "id": "pagination",
      "title": "Pagination you cannot skip"
    }
  ],
  content: () => (
    <article>
      <P>Microsoft Graph delta links work differently from Gmail historyId. Here is how to fetch only changed messages and persist the cursor safely.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="delta-basics">How delta links work</H2>
      <P>The first call hits a delta endpoint with filters — often today&#39;s inbox. Graph returns changed items plus @odata.deltaLink when the page completes.</P>
      <P>Subsequent syncs call the deltaLink URL directly. You receive upserts and removals since the last run without re-listing the folder.</P>

      <H2 id="persist">Where to store the cursor</H2>
      <P>Store outlookMailDeltaLink on the user&#39;s Microsoft integration record. Passing it only via query params works for demos; server-side persistence survives refreshes and background jobs.</P>
      <P>Support deltaLink=clear to reset state when tokens rot or users report stale mail. Wipe the DB field and run an initial delta from scratch.</P>

      <H2 id="persist-false">Fetch now, persist later</H2>
      <P>When downstream processing can fail — AI extraction, batch indexing — fetch with persist=false. Return the new deltaLink in the response but do not write it until processing succeeds.</P>
      <P>Otherwise a crash after fetch skips mail permanently. At-least-once processing needs at-least-once cursors.</P>

      <H2 id="pagination">Pagination you cannot skip</H2>
      <P>@odata.nextLink and @odata.deltaLink serve different roles. deltaLink appears when a sync round completes. Following only the first page truncates busy inboxes.</P>
      <P>Production code should loop nextLink until deltaLink arrives, merging value arrays along the way.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/gmail-historyid-incremental-sync">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
