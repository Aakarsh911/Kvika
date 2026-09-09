import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "why-inbox-zero-fails-engineers",
  title: "Why Inbox Zero Fails Most Engineers",
  description: "Recency sorting, reference vs action mix, and capture systems that survive busy release weeks.",
  date: "2026-02-24",
  tags: ["productivity","email","software-engineers"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "myth",
      "title": "The myth"
    },
    {
      "id": "alternative",
      "title": "Capture alternative"
    }
  ],
  content: () => (
    <article>
      <P>Recency sorting, reference vs action mix, and capture systems that survive busy release weeks.</P>
      <P>These notes come from watching engineers lose commitments across Gmail, Outlook, and calendar tabs — and from building workflows that keep capture and execution in one place.</P>

      <H2 id="myth">The myth</H2>
      <P>Inbox zero as moral virtue breaks when your job is interrupt-driven. Empty inbox ≠ empty commitments.</P>
      <P>Archived threads with un-captured asks are worse than visible clutter.</P>

      <H2 id="alternative">Capture alternative</H2>
      <P>Daily scan for action verbs → task list with dates → link to source.</P>
      <P>Inbox becomes reference; task list becomes execution queue.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related reading:{" "}
        <A href="/blog/stop-losing-action-items-in-your-inbox">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
