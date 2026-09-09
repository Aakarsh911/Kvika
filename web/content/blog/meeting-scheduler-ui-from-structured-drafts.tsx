import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "meeting-scheduler-ui-from-structured-drafts",
  title: "Meeting Scheduler UI From Structured Drafts",
  description: "Agent returns show_meeting_scheduler JSON — pre-filled times, attendees, provider — user confirms before book.",
  date: "2026-09-01",
  tags: ["ai","scheduling","ux","engineering"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "draft",
      "title": "Structured draft"
    },
    {
      "id": "confirm",
      "title": "Confirm step"
    }
  ],
  content: () => (
    <article>
      <P>Agent returns show_meeting_scheduler JSON — pre-filled times, attendees, provider — user confirms before book.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="draft">Structured draft</H2>
      <P>buildMeetingDraft resolves attendees, normalises times, picks provider.</P>
      <P>UI shows PersonRecipientInput for unresolvedAttendees.</P>

      <H2 id="confirm">Confirm step</H2>
      <P>Free/busy check on submit, not on every keystroke.</P>
      <P>Failure surfaces Graph errors as actionable reconnect or widen window.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/jira-tickets-from-natural-language">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
