import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "fallback-when-org-search-is-denied",
  title: "Fallback When Org Directory Search Is Denied",
  description: "startswith(displayName) when $search fails — and accepting imperfection in attendee resolution.",
  date: "2026-07-07",
  tags: ["microsoft-outlook","engineering","search","ux"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "search",
      "title": "$search vs filter"
    },
    {
      "id": "people",
      "title": "/me/people"
    }
  ],
  content: () => (
    <article>
      <P>startswith(displayName) when $search fails — and accepting imperfection in attendee resolution.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="search">$search vs filter</H2>
      <P>ConsistencyLevel eventual + $search fast when allowed.</P>
      <P>startswith misses middle names — user confirms in picker.</P>

      <H2 id="people">/me/people</H2>
      <P>Secondary candidate source for frequent contacts.</P>
      <P>Merge and score uniformly with team + calendar lists.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/people-read-vs-user-readbasic-all">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
