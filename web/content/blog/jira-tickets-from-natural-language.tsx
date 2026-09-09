import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "jira-tickets-from-natural-language",
  title: "Jira Tickets From Natural Language Agent Requests",
  description: "Structured draft cards before create — same human-review pattern as email compose.",
  date: "2026-08-25",
  tags: ["ai","jira","engineering","productivity"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "draft",
      "title": "Draft first"
    },
    {
      "id": "agent",
      "title": "Agent tool"
    }
  ],
  content: () => (
    <article>
      <P>Structured draft cards before create — same human-review pattern as email compose.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="draft">Draft first</H2>
      <P>show_jira_ticket_draft clientAction with title, description, project hint.</P>
      <P>User edits in card; submit calls create API — no silent ticket spam.</P>

      <H2 id="agent">Agent tool</H2>
      <P>Lambda jira-actions.mjs → internal route with Zod schema.</P>
      <P>Same secret auth and userEmail propagation as gmail actions.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/calendar-colour-coding-by-source">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
