import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "lessons-shipping-unified-productivity-tools",
  title: "Lessons From Shipping Unified Productivity Tools",
  description: "Incremental sync, explicit consent, human review on AI actions, and mixed-stack first — themes from a year of building.",
  date: "2026-09-08",
  tags: ["product","engineering","productivity","retrospective"],
  author: "Kvika Team",
  readTime: "7 min",
  sections: [
    {
      "id": "sync",
      "title": "Sync is the product"
    },
    {
      "id": "ai",
      "title": "AI as propose"
    },
    {
      "id": "mixed",
      "title": "Mixed stack first"
    },
    {
      "id": "next",
      "title": "What is next"
    }
  ],
  content: () => (
    <article>
      <P>Incremental sync, explicit consent, human review on AI actions, and mixed-stack first — themes from a year of building.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="sync">Sync is the product</H2>
      <P>Calendar and mail UX is only as good as cursor discipline and conflict rules.</P>
      <P>Users forgive plain UI; they do not forgive missing meetings.</P>

      <H2 id="ai">AI as propose</H2>
      <P>Extract, compose, schedule — all draft + confirm. Autonomy comes after trust metrics.</P>
      <P>Consent and rate limits are feature requirements, not compliance checkbox.</P>

      <H2 id="mixed">Mixed stack first</H2>
      <P>Design for Google + Microsoft day one. Single-stack shortcuts become dead ends.</P>
      <P>Name resolution, dual cursors, provider-default create — all symptoms of same reality.</P>

      <H2 id="next">What is next</H2>
      <P>Full calendar delta in production paths. Subscription renewal mapping. Conflict reconciliation UI.</P>
      <P>Ship incremental value; document footguns honestly in engineering posts like these.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related reading:{" "}
        <A href="/blog/syncing-google-and-microsoft-calendars-programmatically">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
