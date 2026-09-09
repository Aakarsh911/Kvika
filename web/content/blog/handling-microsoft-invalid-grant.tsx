import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "handling-microsoft-invalid-grant",
  title: "Handling Microsoft invalid_grant and Silent Integration Breakage",
  description: "Refresh failures after password change, conditional access, or revoked sessions — UX that saves support hours.",
  date: "2026-04-14",
  tags: ["microsoft-outlook","oauth","support","engineering"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "symptoms",
      "title": "Symptoms"
    },
    {
      "id": "fix",
      "title": "Fix UX"
    }
  ],
  content: () => (
    <article>
      <P>Refresh failures after password change, conditional access, or revoked sessions — UX that saves support hours.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="symptoms">Symptoms</H2>
      <P>Mail empty, calendar frozen, no hard error in UI if you swallow 401.</P>
      <P>Logs show refresh 400 invalid_grant.</P>

      <H2 id="fix">Fix UX</H2>
      <P>needsReauth banner on integration card. One-click reconnect preserving userId.</P>
      <P>Email user when background job hits invalid_grant — do not wait for login.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/choosing-oauth-scopes-carefully">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
