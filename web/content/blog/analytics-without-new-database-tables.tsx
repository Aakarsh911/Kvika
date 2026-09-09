import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "analytics-without-new-database-tables",
  title: "Product Analytics Without New Database Tables",
  description: "Aggregating focus hours, meeting load, and task sources from existing CalendarEvent, Task, and Integration rows.",
  date: "2025-12-30",
  tags: ["analytics","engineering","productivity","sql"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "approach",
      "title": "Ship without schema migrations"
    },
    {
      "id": "insights",
      "title": "Rule-based insights"
    },
    {
      "id": "integrations",
      "title": "Integration health"
    }
  ],
  content: () => (
    <article>
      <P>Aggregating focus hours, meeting load, and task sources from existing CalendarEvent, Task, and Integration rows.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="approach">Ship without schema migrations</H2>
      <P>KPIs from queries over events and tasks in range — sumEventHours clips to window boundaries.</P>
      <P>Week vs month toggles date-fns intervals; compare to prior period for delta strings.</P>

      <H2 id="insights">Rule-based insights</H2>
      <P>Heuristics: stale open tasks, meeting-heavy days, low focus — generated in code not ML.</P>
      <P>Keeps dashboard explainable; users trust &#39;12 open &gt;14 days&#39; more than black-box scores.</P>

      <H2 id="integrations">Integration health</H2>
      <P>Surface lastSyncedAt and sync errors from Integration + CalendarSync.</P>
      <P>Empty analytics with broken OAuth is a reconnect prompt, not zero activity.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/compose-email-drafts-from-natural-language">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
