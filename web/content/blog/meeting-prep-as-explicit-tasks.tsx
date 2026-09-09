import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "meeting-prep-as-explicit-tasks",
  title: "Meeting Prep as Explicit Tasks (Not Implied by the Invite)",
  description: "Calendar invites hide homework — linking prep tasks to source threads and invites so nothing slips.",
  date: "2026-02-17",
  tags: ["productivity","tasks","meetings","calendar"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "leak",
      "title": "The prep leak"
    },
    {
      "id": "fix",
      "title": "Explicit capture"
    }
  ],
  content: () => (
    <article>
      <P>Calendar invites hide homework — linking prep tasks to source threads and invites so nothing slips.</P>
      <P>These notes come from watching engineers lose commitments across Gmail, Outlook, and calendar tabs — and from building workflows that keep capture and execution in one place.</P>

      <H2 id="leak">The prep leak</H2>
      <P>&#39;Design review Thursday&#39; assumes doc read, Figma review, comment pass. None of that is in the task system.</P>
      <P>Same leak class as inbox action items — implicit work without owner or date.</P>

      <H2 id="fix">Explicit capture</H2>
      <P>When scheduling, optional checklist: prep tasks with due before start. Link url to invite or doc.</P>
      <P>AI can suggest prep from agenda email — human confirms before create.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related reading:{" "}
        <A href="/blog/stop-losing-action-items-in-your-inbox">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
