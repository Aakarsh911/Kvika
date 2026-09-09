import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "recurring-meetings-that-should-have-ended",
  title: "Recurring Meetings That Should Have Ended Months Ago",
  description: "Stale recurrences clog calendars silently — quarterly audit checklist for eng teams.",
  date: "2026-03-24",
  tags: ["meetings","productivity","calendar","team-culture"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "drift",
      "title": "Recurrence drift"
    },
    {
      "id": "audit",
      "title": "Audit ritual"
    }
  ],
  content: () => (
    <article>
      <P>Stale recurrences clog calendars silently — quarterly audit checklist for eng teams.</P>
      <P>These notes come from watching engineers lose commitments across Gmail, Outlook, and calendar tabs — and from building workflows that keep capture and execution in one place.</P>

      <H2 id="drift">Recurrence drift</H2>
      <P>Project ended; standup remains. Attendance drops to two people multitasking.</P>
      <P>Calendar weight distorts analytics — looks busy, feels empty.</P>

      <H2 id="audit">Audit ritual</H2>
      <P>Quarterly: list recurrences &gt;8 weeks, ask owner continue/shrink/kill.</P>
      <P>Require agenda owner rotation or auto-expire.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/scheduling-buffers-between-meetings">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
