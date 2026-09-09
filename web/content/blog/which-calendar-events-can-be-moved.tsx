import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "which-calendar-events-can-be-moved",
  title: "Which Calendar Events Can Be Rescheduled Automatically",
  description: "isEventManageable logic: protecting meetings with external guests while allowing focus blocks and solo holds to shift.",
  date: "2025-08-05",
  tags: ["calendar","scheduling","engineering","productivity"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "hard-rules",
      "title": "Hard rules"
    },
    {
      "id": "soft-blocks",
      "title": "Soft blocks"
    },
    {
      "id": "push-back",
      "title": "Push changes back"
    }
  ],
  content: () => (
    <article>
      <P>isEventManageable logic: protecting meetings with external guests while allowing focus blocks and solo holds to shift.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="hard-rules">Hard rules</H2>
      <P>Meetings with any attendee email ≠ user cannot auto-move. External guests imply coordination cost no algorithm should hide.</P>
      <P>All-day events and immovable provider flags need explicit UI before drag-and-drop reschedule.</P>

      <H2 id="soft-blocks">Soft blocks</H2>
      <P>FOCUS_TIME and TASK types default to manageable. Solo PERSONAL events with zero or self-only attendees qualify.</P>
      <P>Expose isManaged on create so users opt in: &#39;Allow Kvika to reschedule this event&#39;.</P>

      <H2 id="push-back">Push changes back</H2>
      <P>Local reschedule sets modifiedLocally and syncStatus PENDING. Push job writes to Google or Microsoft. Pull must not overwrite until push completes or conflict is detected.</P>
      <P>Without the flag, external sync clobbers local moves.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/classifying-calendar-events-automatically">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
