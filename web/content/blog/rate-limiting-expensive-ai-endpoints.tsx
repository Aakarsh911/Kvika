import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "rate-limiting-expensive-ai-endpoints",
  title: "Rate Limiting Expensive AI Endpoints",
  description: "Redis-backed sliding windows for agent, extract, and chat — protecting cost and upstream quotas per user.",
  date: "2025-11-18",
  tags: ["ai","engineering","redis","security"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "keys",
      "title": "Per-user keys"
    },
    {
      "id": "implementation",
      "title": "Implementation sketch"
    }
  ],
  content: () => (
    <article>
      <P>Redis-backed sliding windows for agent, extract, and chat — protecting cost and upstream quotas per user.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="keys">Per-user keys</H2>
      <P>ai:agent:&#123;email&#125; 20/min. ai:extract-emails 6/min. Separate buckets so one heavy extract does not block chat.</P>
      <P>Return retryAfterSeconds in 429 JSON for client backoff.</P>

      <H2 id="implementation">Implementation sketch</H2>
      <P>INCR with TTL window or sliding log in Redis. Fail open vs closed is a product choice — fail closed for cost control.</P>
      <P>Log rate limit hits to spot abuse or UX friction (limit too tight).</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/ai-consent-before-processing-mail">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
