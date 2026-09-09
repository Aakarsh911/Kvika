import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "deep-work-blocks-that-survive-rescheduling",
  title: "Deep Work Blocks That Survive a Rescheduling Algorithm",
  description: "Movable focus time only works when meetings with guests stay pinned — design rules for automatic calendar repair.",
  date: "2026-05-12",
  tags: ["focus","calendar","productivity","engineering"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "intent",
      "title": "Intent"
    },
    {
      "id": "user",
      "title": "User trust"
    }
  ],
  content: () => (
    <article>
      <P>Movable focus time only works when meetings with guests stay pinned — design rules for automatic calendar repair.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="intent">Intent</H2>
      <P>Algorithm fills gaps by moving owned blocks, not by shrinking immovable meetings.</P>
      <P>isEventManageable gate is the product soul.</P>

      <H2 id="user">User trust</H2>
      <P>Show what moved and why in activity log.</P>
      <P>Undo window for automatic moves in early versions.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/prioritisation-when-everything-is-urgent">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
