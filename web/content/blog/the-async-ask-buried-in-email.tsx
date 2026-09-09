import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "the-async-ask-buried-in-email",
  title: "The Async Ask Buried Mid-Paragraph",
  description: "Recognising low-friction requests that never become tickets — and why AI extraction helps on busy weeks.",
  date: "2026-03-10",
  tags: ["productivity","email","tasks","communication"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "pattern",
      "title": "The pattern"
    },
    {
      "id": "capture",
      "title": "Capture habits"
    }
  ],
  content: () => (
    <article>
      <P>Recognising low-friction requests that never become tickets — and why AI extraction helps on busy weeks.</P>
      <P>These notes come from watching engineers lose commitments across Gmail, Outlook, and calendar tabs — and from building workflows that keep capture and execution in one place.</P>

      <H2 id="pattern">The pattern</H2>
      <P>&#39;When you get a chance&#39; reads optional until someone pings two weeks later.</P>
      <P>Highest leak rate because guilt replaces tracking.</P>

      <H2 id="capture">Capture habits</H2>
      <P>Highlight + task in one motion. AI batch suggest on daily trigger.</P>
      <P>Team norm: explicit ticket or explicit no — middle ground fills inbox guilt only.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/context-switching-between-gmail-and-outlook">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
