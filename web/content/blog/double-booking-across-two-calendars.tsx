import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "double-booking-across-two-calendars",
  title: "Double Booking Across Two Calendars",
  description: "Google personal + Outlook work on one grid — detecting overlaps before they become awkward Zoom exits.",
  date: "2026-04-21",
  tags: ["calendar","productivity","google-calendar","microsoft-outlook"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "cause",
      "title": "Why it happens"
    },
    {
      "id": "fix",
      "title": "Mitigation"
    }
  ],
  content: () => (
    <article>
      <P>Google personal + Outlook work on one grid — detecting overlaps before they become awkward Zoom exits.</P>
      <P>These notes come from watching engineers lose commitments across Gmail, Outlook, and calendar tabs — and from building workflows that keep capture and execution in one place.</P>

      <H2 id="cause">Why it happens</H2>
      <P>Each provider only knows its own bookings. Accept on Google while Outlook shows free.</P>
      <P>Unified view must merge before offering slots to others.</P>

      <H2 id="fix">Mitigation</H2>
      <P>Single grid all sources. Conflict highlight when events overlap in time.</P>
      <P>Scheduling assistant reads combined busy, not one provider.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/handling-microsoft-invalid-grant">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
