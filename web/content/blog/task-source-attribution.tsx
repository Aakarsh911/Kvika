import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "task-source-attribution",
  title: "Task Source Attribution: EMAIL_AI, TEAMS, and Beyond",
  description: "Why source enums matter for analytics, filters, and trusting where work came from.",
  date: "2026-07-21",
  tags: ["tasks","analytics","engineering","productivity"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "enum",
      "title": "Source enum"
    },
    {
      "id": "metadata",
      "title": "sourceData JSON"
    }
  ],
  content: () => (
    <article>
      <P>Why source enums matter for analytics, filters, and trusting where work came from.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="enum">Source enum</H2>
      <P>EMAIL_AI vs MANUAL vs TEAMS drives dashboard pie and filter chips.</P>
      <P>Wrong source breaks &#39;tasks from email this week&#39; KPI.</P>

      <H2 id="metadata">sourceData JSON</H2>
      <P>Store emailSubject, from, confidence, extractedAt for audit.</P>
      <P>Support asks &#39;why was this created?&#39; — metadata answers.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/typeahead-search-across-multiple-sources">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
