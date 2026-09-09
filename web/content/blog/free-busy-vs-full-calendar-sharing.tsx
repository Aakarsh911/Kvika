import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "free-busy-vs-full-calendar-sharing",
  title: "Free/Busy vs Full Calendar Sharing",
  description: "Privacy-preserving scheduling uses availability bits, not full title export — especially cross-org.",
  date: "2026-03-31",
  tags: ["scheduling","privacy","calendar","microsoft-outlook"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "privacy",
      "title": "Privacy"
    },
    {
      "id": "product",
      "title": "Product implication"
    }
  ],
  content: () => (
    <article>
      <P>Privacy-preserving scheduling uses availability bits, not full title export — especially cross-org.</P>
      <P>These notes come from watching engineers lose commitments across Gmail, Outlook, and calendar tabs — and from building workflows that keep capture and execution in one place.</P>

      <H2 id="privacy">Privacy</H2>
      <P>Teammates need slots, not &#39;Therapy&#39; or &#39;Interview prep&#39; titles.</P>
      <P>Free/busy API returns blocks without subject when permissions tight.</P>

      <H2 id="product">Product implication</H2>
      <P>Scheduling UI shows green/red grid, not full event list for peers unless shared.</P>
      <P>Organiser sees own titles; attendees see intersection only.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/recurring-meetings-that-should-have-ended">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
