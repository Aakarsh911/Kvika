import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "task-capture-from-slack-email-teams",
  title: "Task Capture From Slack, Email, and Teams",
  description: "Different channels, same execution queue — source attribution and link-back patterns.",
  date: "2026-04-28",
  tags: ["tasks","productivity","microsoft-teams","email"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "sources",
      "title": "Sources"
    },
    {
      "id": "unify",
      "title": "One queue"
    }
  ],
  content: () => (
    <article>
      <P>Different channels, same execution queue — source attribution and link-back patterns.</P>
      <P>These notes come from watching engineers lose commitments across Gmail, Outlook, and calendar tabs — and from building workflows that keep capture and execution in one place.</P>

      <H2 id="sources">Sources</H2>
      <P>EMAIL_AI, TEAMS, MANUAL, JIRA, GITHUB — task.source drives filters and analytics colours.</P>
      <P>Each creation path stores url + sourceData blob for context.</P>

      <H2 id="unify">One queue</H2>
      <P>Engineers should not check three apps for today&#39;s work.</P>
      <P>Extraction proposes; unified list executes.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/double-booking-across-two-calendars">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
