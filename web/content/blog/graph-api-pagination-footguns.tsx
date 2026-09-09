import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "graph-api-pagination-footguns",
  title: "Microsoft Graph Pagination Footguns",
  description: "nextLink vs deltaLink, @odata.nextLink on first sync, and stopping too early.",
  date: "2026-06-09",
  tags: ["microsoft-outlook","graph-api","engineering","sync"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "confusion",
      "title": "Common confusion"
    },
    {
      "id": "top",
      "title": "$top limits"
    }
  ],
  content: () => (
    <article>
      <P>nextLink vs deltaLink, @odata.nextLink on first sync, and stopping too early.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="confusion">Common confusion</H2>
      <P>Developers grab first page deltaLink — missing events on page 2+.</P>
      <P>Loop until deltaLink present, not until value.length === 0.</P>

      <H2 id="top">$top limits</H2>
      <P>$top=50 on busy inbox needs pagination same day.</P>
      <P>Log page count on initial connect for quota planning.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/stale-sync-after-vacation">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
