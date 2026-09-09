import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "time-zones-in-calendar-apis",
  title: "Time Zones in Calendar APIs: Practical Rules",
  description: "Store UTC, display local, request UTC from Graph with Prefer header — rules that prevent 6am meeting disasters.",
  date: "2026-01-20",
  tags: ["calendar","timezones","engineering","microsoft-outlook"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "store",
      "title": "Store and display"
    },
    {
      "id": "graph",
      "title": "Graph Prefer header"
    },
    {
      "id": "llm",
      "title": "LLM scheduling"
    }
  ],
  content: () => (
    <article>
      <P>Store UTC, display local, request UTC from Graph with Prefer header — rules that prevent 6am meeting disasters.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="store">Store and display</H2>
      <P>Database timestamps in UTC. UI renders with user IANA zone from profile or browser.</P>
      <P>Never show raw API strings without knowing if offset included.</P>

      <H2 id="graph">Graph Prefer header</H2>
      <P>Prefer: outlook.timezone=&quot;UTC&quot; on calendarView reduces ambiguous offsets in multi-mailbox sync.</P>
      <P>Still confirm with users on scheduling confirm step.</P>

      <H2 id="llm">LLM scheduling</H2>
      <P>Separate wall-clock local path for model output without Z — see dedicated post.</P>
      <P>Agent runtime prompt can include user timeZone and currentTime for grounding.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/all-day-events-across-providers">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
