import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "calendar-colour-coding-by-source",
  title: "Calendar Colour Coding by Source",
  description: "Visual distinction for Google vs Microsoft events on unified grid — reducing 'where did this come from?' confusion.",
  date: "2026-08-18",
  tags: ["calendar","ux","design","productivity"],
  author: "Kvika Team",
  readTime: "4 min",
  sections: [
    {
      "id": "why",
      "title": "Why colour"
    }
  ],
  content: () => (
    <article>
      <P>Visual distinction for Google vs Microsoft events on unified grid — reducing &#39;where did this come from?&#39; confusion.</P>
      <P>These notes come from watching engineers lose commitments across Gmail, Outlook, and calendar tabs — and from building workflows that keep capture and execution in one place.</P>

      <H2 id="why">Why colour</H2>
      <P>Merged grid blurs ownership. Border or dot by EventSource helps debug sync and double-booking.</P>
      <P>Accessibility: do not rely on colour alone — label in tooltip.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/building-for-mixed-google-microsoft-teams">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
