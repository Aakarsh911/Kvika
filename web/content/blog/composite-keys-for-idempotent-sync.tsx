import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "composite-keys-for-idempotent-sync",
  title: "Composite Keys for Idempotent Calendar and Mail Sync",
  description: "userId + source + sourceId uniqueness — surviving overlapping cron, webhooks, and manual refresh.",
  date: "2026-01-27",
  tags: ["sync","database","engineering","reliability"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "why",
      "title": "Why idempotency"
    },
    {
      "id": "keys",
      "title": "Key choice"
    },
    {
      "id": "upsert",
      "title": "Upsert pattern"
    }
  ],
  content: () => (
    <article>
      <P>userId + source + sourceId uniqueness — surviving overlapping cron, webhooks, and manual refresh.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="why">Why idempotency</H2>
      <P>At-least-once delivery is default for webhooks and client retries.</P>
      <P>Without unique constraints duplicates appear as ghost meetings or twin tasks.</P>

      <H2 id="keys">Key choice</H2>
      <P>Calendar: (userId, source GOOGLE|MICROSOFT, sourceId provider event id).</P>
      <P>Tasks: sourceId = email id or message id + optional disambiguator for multi-task messages.</P>

      <H2 id="upsert">Upsert pattern</H2>
      <P>find unique → update or create. On conflict update changed fields only when !modifiedLocally.</P>
      <P>Logs: created vs updated vs unchanged counts per sync job.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/time-zones-in-calendar-apis">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
