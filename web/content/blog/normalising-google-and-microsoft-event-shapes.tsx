import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "normalising-google-and-microsoft-event-shapes",
  title: "Normalising Google and Microsoft Events Into One Shape",
  description: "summary vs subject, htmlLink vs webLink, all-day date vs dateTime — the mapping layer every dual-calendar product needs.",
  date: "2025-09-02",
  tags: ["calendar","engineering","google-calendar","microsoft-outlook"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "fields",
      "title": "Field mapping"
    },
    {
      "id": "allday",
      "title": "All-day edge cases"
    },
    {
      "id": "idempotency",
      "title": "Idempotent upserts"
    }
  ],
  content: () => (
    <article>
      <P>summary vs subject, htmlLink vs webLink, all-day date vs dateTime — the mapping layer every dual-calendar product needs.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="fields">Field mapping</H2>
      <P>Internal model: title, startTime, endTime, isAllDay, location, attendees[], source, sourceId, sourceCalendarId.</P>
      <P>Google summary → title. Microsoft subject → title. Preserve provider link for &#39;open in Outlook&#39;.</P>

      <H2 id="allday">All-day edge cases</H2>
      <P>Google all-day uses date not dateTime. Microsoft may still send midnight UTC boundaries.</P>
      <P>Store isAllDay explicitly; render with local midnight rules, not raw UTC strings.</P>

      <H2 id="idempotency">Idempotent upserts</H2>
      <P>Unique on (userId, source, sourceId). Retries and overlapping jobs upsert safely.</P>
      <P>Duplicates show as ghost meetings — users blame the product, not the API.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/incremental-sync-tokens-that-expire">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
