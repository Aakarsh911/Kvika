import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "all-day-events-across-providers",
  title: "All-Day Events Across Google and Microsoft",
  description: "date vs dateTime fields, timezone-less all-day blocks, and rendering without off-by-one day shifts.",
  date: "2026-01-13",
  tags: ["calendar","timezones","engineering","google-calendar"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "representations",
      "title": "Provider representations"
    },
    {
      "id": "storage",
      "title": "Storage"
    }
  ],
  content: () => (
    <article>
      <P>date vs dateTime fields, timezone-less all-day blocks, and rendering without off-by-one day shifts.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="representations">Provider representations</H2>
      <P>Google all-day: start.date &#39;2025-06-15&#39;. Timed: start.dateTime with timeZone.</P>
      <P>Microsoft may emit midnight boundaries — detect with !event.start.dateTime pattern.</P>

      <H2 id="storage">Storage</H2>
      <P>isAllDay flag on normalised row. UI edit dialog may block reschedule for all-day until supported.</P>
      <P>Do not run duration math on all-day using hour deltas.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/email-push-vs-poll-tradeoffs">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
