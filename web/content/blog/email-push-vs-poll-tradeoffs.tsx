import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "email-push-vs-poll-tradeoffs",
  title: "Email Push vs Poll: Tradeoffs for Unified Inboxes",
  description: "30-second polling, SSE nudges, and provider webhooks — layering reliability without API hammering.",
  date: "2026-01-06",
  tags: ["email","engineering","real-time","architecture"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "poll",
      "title": "Polling baseline"
    },
    {
      "id": "push",
      "title": "Push benefits"
    },
    {
      "id": "layer",
      "title": "Layered design"
    }
  ],
  content: () => (
    <article>
      <P>30-second polling, SSE nudges, and provider webhooks — layering reliability without API hammering.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="poll">Polling baseline</H2>
      <P>Simple, works everywhere, wastes quota when idle. Good backstop when webhooks drop.</P>
      <P>Use incremental cursors on poll — not full fetch.</P>

      <H2 id="push">Push benefits</H2>
      <P>Near-real-time unread badges. Lower average API volume for active mailboxes.</P>
      <P>Ops cost: renewal, validation, multi-instance fanout.</P>

      <H2 id="layer">Layered design</H2>
      <P>Webhook → invalidate cache → SSE nudge → client incremental merge.</P>
      <P>forceRefresh on every SSE event negates cursor savings — debounce.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/analytics-without-new-database-tables">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
