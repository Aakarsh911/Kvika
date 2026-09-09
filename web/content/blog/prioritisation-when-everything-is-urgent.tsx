import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "prioritisation-when-everything-is-urgent",
  title: "Prioritisation When Everything Is Urgent",
  description: "Priority fields in extracted tasks — making AI suggestions editable before they land in the backlog.",
  date: "2026-05-05",
  tags: ["tasks","productivity","ai","software-engineers"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "noise",
      "title": "Urgency inflation"
    },
    {
      "id": "review",
      "title": "Review gate"
    }
  ],
  content: () => (
    <article>
      <P>Priority fields in extracted tasks — making AI suggestions editable before they land in the backlog.</P>
      <P>These notes come from watching engineers lose commitments across Gmail, Outlook, and calendar tabs — and from building workflows that keep capture and execution in one place.</P>

      <H2 id="noise">Urgency inflation</H2>
      <P>Everything marked high → nothing is. Model over-weights &#39;ASAP&#39; in subject lines.</P>
      <P>Default medium; user promotes.</P>

      <H2 id="review">Review gate</H2>
      <P>Batch extract UI shows suggestions before bulk create — or create with easy bulk edit.</P>
      <P>Due dates optional but powerful when present.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/task-capture-from-slack-email-teams">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
