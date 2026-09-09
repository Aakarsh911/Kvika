import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "stale-sync-after-vacation",
  title: "Stale Sync After Vacation: User Expectations and Catch-Up UX",
  description: "Returning from PTO to expired tokens and 410 sync responses — designing calm catch-up flows.",
  date: "2026-06-02",
  tags: ["calendar","email","sync","ux"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "return",
      "title": "Return experience"
    },
    {
      "id": "token",
      "title": "Token rot"
    }
  ],
  content: () => (
    <article>
      <P>Returning from PTO to expired tokens and 410 sync responses — designing calm catch-up flows.</P>
      <P>These notes come from watching engineers lose commitments across Gmail, Outlook, and calendar tabs — and from building workflows that keep capture and execution in one place.</P>

      <H2 id="return">Return experience</H2>
      <P>User expects two weeks of mail and events to appear.</P>
      <P>Full re-sync + progress bar beats silent failure.</P>

      <H2 id="token">Token rot</H2>
      <P>Long idle may expire refresh. Reconnect prompt on first failed job after login.</P>
      <P>Partial data with banner beats empty state.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/writing-events-back-to-the-right-provider">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
