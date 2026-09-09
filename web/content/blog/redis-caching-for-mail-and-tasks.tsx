import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "redis-caching-for-mail-and-tasks",
  title: "Redis Caching for Mail and Tasks",
  description: "Cache keys scoped by user and day, pattern invalidation on webhook, and when del beats update.",
  date: "2025-11-25",
  tags: ["redis","engineering","email","performance"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "keys",
      "title": "Key design"
    },
    {
      "id": "invalidate",
      "title": "Invalidation"
    },
    {
      "id": "miss",
      "title": "Cache miss path"
    }
  ],
  content: () => (
    <article>
      <P>Cache keys scoped by user and day, pattern invalidation on webhook, and when del beats update.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="keys">Key design</H2>
      <P>emails:&#123;userId&#125;:&#123;date&#125; for list cache. tasks:&#123;userId&#125; for task board.</P>
      <P>Include provider in key if partial cache per stack.</P>

      <H2 id="invalidate">Invalidation</H2>
      <P>Gmail sync deletes cache key on any change set. Outlook webhook deleteCachePattern emails:&#123;userId&#125;:*.</P>
      <P>Over-invalidation is safer than stale mail after read/unread toggle.</P>

      <H2 id="miss">Cache miss path</H2>
      <P>Miss falls through to provider fetch. Always refresh cursors on origin, not from cache metadata.</P>
      <P>TTL backup if webhooks drop — 5–15 min for mail lists acceptable with incremental merge.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/rate-limiting-expensive-ai-endpoints">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
