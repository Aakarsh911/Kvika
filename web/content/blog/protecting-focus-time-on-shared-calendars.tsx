import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "protecting-focus-time-on-shared-calendars",
  title: "Protecting Focus Time on Shared Calendars",
  description: "Classification, isManaged, and why external-attendee meetings stay immovable — product rules for automatic reschedule.",
  date: "2026-02-10",
  tags: ["productivity","calendar","focus","scheduling"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "product",
      "title": "Product intent"
    },
    {
      "id": "signals",
      "title": "Signals"
    },
    {
      "id": "algorithm",
      "title": "Rescheduler"
    }
  ],
  content: () => (
    <article>
      <P>Classification, isManaged, and why external-attendee meetings stay immovable — product rules for automatic reschedule.</P>
      <P>These notes come from watching engineers lose commitments across Gmail, Outlook, and calendar tabs — and from building workflows that keep capture and execution in one place.</P>

      <H2 id="product">Product intent</H2>
      <P>Focus blocks exist to defend deep work. Auto-move only blocks the user owns end-to-end.</P>
      <P>Client meetings stay fixed — moving them without consent destroys trust.</P>

      <H2 id="signals">Signals</H2>
      <P>FOCUS_TIME type + no external guests + isManaged true = movable.</P>
      <P>Keyword classification bootstraps; users rename &#39;Focus&#39; to custom titles over time — allow manual type override.</P>

      <H2 id="algorithm">Rescheduler</H2>
      <P>Example algorithm finds gaps, PATCHes manageable events, sets modifiedLocally.</P>
      <P>First-fit is v0; priority and deadline awareness belong in v2.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/the-modifiedlocally-flag-pattern">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
