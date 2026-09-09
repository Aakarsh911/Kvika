import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "typeahead-search-across-multiple-sources",
  title: "Typeahead Search Across Multiple People Sources",
  description: "searchPeople merges Teams, calendar history, and org candidates — dedupe by email, rank by score.",
  date: "2026-07-14",
  tags: ["ux","search","engineering","microsoft-teams"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "merge",
      "title": "Merge logic"
    },
    {
      "id": "min",
      "title": "Minimum query length"
    }
  ],
  content: () => (
    <article>
      <P>searchPeople merges Teams, calendar history, and org candidates — dedupe by email, rank by score.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="merge">Merge logic</H2>
      <P>Promise.all three sources. Map by email lowercase; keep highest score.</P>
      <P>Return top 8 for dropdown — same component in meeting scheduler and compose.</P>

      <H2 id="min">Minimum query length</H2>
      <P>q.length &lt; 2 returns [] — avoids expensive Graph calls on single keystroke.</P>
      <P>Debounce 200ms in UI layer.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/fallback-when-org-search-is-denied">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
