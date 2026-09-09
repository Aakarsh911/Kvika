import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "email-notification-batching",
  title: "Email Notification Batching for Sanity",
  description: "Webhook storms and SSE debounce — reducing refresh thrash without missing important mail.",
  date: "2026-05-19",
  tags: ["email","productivity","engineering","ux"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "storm",
      "title": "Notification storms"
    },
    {
      "id": "important",
      "title": "Important senders"
    }
  ],
  content: () => (
    <article>
      <P>Webhook storms and SSE debounce — reducing refresh thrash without missing important mail.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="storm">Notification storms</H2>
      <P>Label sync can fire dozens of webhooks in seconds.</P>
      <P>Debounce client fetch 2–5s; coalesce unread badge updates.</P>

      <H2 id="important">Important senders</H2>
      <P>Optional VIP list breaks through batch — product decision.</P>
      <P>Most users prefer stable UI over instant for bulk noise.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/deep-work-blocks-that-survive-rescheduling">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
