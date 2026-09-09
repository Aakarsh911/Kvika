import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "the-modifiedlocally-flag-pattern",
  title: "The modifiedLocally Flag Pattern for Bidirectional Sync",
  description: "Mark local edits before push completes so pull sync does not clobber user drags on the calendar grid.",
  date: "2026-02-03",
  tags: ["sync","calendar","engineering","ux"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "flow",
      "title": "Edit flow"
    },
    {
      "id": "cleanup",
      "title": "cleanupDeletedEvents"
    }
  ],
  content: () => (
    <article>
      <P>Mark local edits before push completes so pull sync does not clobber user drags on the calendar grid.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="flow">Edit flow</H2>
      <P>PATCH event → modifiedLocally true, syncStatus PENDING. Push job writes external.</P>
      <P>Pull sees flag — skip blind overwrite of title/times; check conflict instead.</P>

      <H2 id="cleanup">cleanupDeletedEvents</H2>
      <P>Never delete modifiedLocally rows during reconciliation — user may have deleted externally while editing locally.</P>
      <P>Explicit user delete triggers external delete TODO path.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/composite-keys-for-idempotent-sync">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
