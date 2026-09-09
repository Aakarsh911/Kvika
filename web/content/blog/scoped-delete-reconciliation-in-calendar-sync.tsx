import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "scoped-delete-reconciliation-in-calendar-sync",
  title: "Scoped Delete Reconciliation: Do Not Wipe Events Outside the Sync Window",
  description: "cleanupDeletedEvents must only delete DB rows inside the fetched date range — or a partial API response deletes your entire history.",
  date: "2025-08-19",
  tags: ["calendar","sync","engineering","reliability"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "bug",
      "title": "The scary bug"
    },
    {
      "id": "fix",
      "title": "The fix"
    },
    {
      "id": "removed-flag",
      "title": "Microsoft @removed"
    }
  ],
  content: () => (
    <article>
      <P>cleanupDeletedEvents must only delete DB rows inside the fetched date range — or a partial API response deletes your entire history.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="bug">The scary bug</H2>
      <P>Sync fetches this week only. Reconciliation deletes any DB event whose sourceId is missing from the response.</P>
      <P>Events next month vanish because they were not in this week&#39;s fetch. Users lose data; you lose trust.</P>

      <H2 id="fix">The fix</H2>
      <P>Scope delete candidates to startTime &gt;= windowStart AND endTime &lt;= windowEnd. Never delete modifiedLocally rows without explicit user action.</P>
      <P>Log titles of deleted rows — first five — for support debugging.</P>

      <H2 id="removed-flag">Microsoft @removed</H2>
      <P>Delta sync sends explicit removals. Windowed full fetch does not. Match delete strategy to fetch mode.</P>
      <P>Incremental delta: honour @removed globally. Window list: scoped reconciliation only.</P>

      <Callout type="tip">The blog post on calendar sync tokens describes 410 Gone fallbacks — pair that with scoped deletes on full re-sync.</Callout>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related reading:{" "}
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
