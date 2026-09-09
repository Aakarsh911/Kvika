import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "oauth-token-refresh-under-load",
  title: "OAuth Token Refresh Under Concurrent Load",
  description: "Multiple tabs, webhooks, and cron jobs refreshing the same Microsoft or Google token can race. Patterns for proactive refresh and safe persistence.",
  date: "2025-07-01",
  tags: ["oauth","security","engineering","google","microsoft-outlook"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "expiry",
      "title": "Proactive vs reactive refresh"
    },
    {
      "id": "races",
      "title": "Refresh races"
    },
    {
      "id": "listeners",
      "title": "Fire-and-forget token listeners"
    },
    {
      "id": "ux",
      "title": "Reconnect UX"
    }
  ],
  content: () => (
    <article>
      <P>Multiple tabs, webhooks, and cron jobs refreshing the same Microsoft or Google token can race. Patterns for proactive refresh and safe persistence.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="expiry">Proactive vs reactive refresh</H2>
      <P>Check expiresAt before each Graph or Gmail call. Refresh when now &gt;= expiresAt, not only after 401.</P>
      <P>Reactive-only refresh feels fine until background jobs and UI requests hit the same expired token simultaneously.</P>

      <H2 id="races">Refresh races</H2>
      <P>Two requests both see expiry, both refresh, both write Integration rows. Last write wins; refresh token rotation can invalidate the other session.</P>
      <P>Ideal fix: single-flight refresh per user+provider with a short lock. Minimum fix: refresh synchronously in one code path and reuse the updated row.</P>

      <H2 id="listeners">Fire-and-forget token listeners</H2>
      <P>Google client libraries emit tokens mid-request. Persist in a void async handler but log failures loudly.</P>
      <P>Silent persistence failure means the next request uses stale DB tokens while memory had fresh ones.</P>

      <H2 id="ux">Reconnect UX</H2>
      <P>Map invalid_grant and missing refresh_token to needsReauth: true. Generic 401 sends users in circles.</P>
      <P>Microsoft accounts go stale after admin policy changes. Surface which provider broke.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/when-not-to-save-your-sync-cursor">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
