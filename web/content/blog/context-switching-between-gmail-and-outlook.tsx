import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "context-switching-between-gmail-and-outlook",
  title: "The Hidden Cost of Switching Between Gmail and Outlook",
  description: "Dual inbox tabs, missed threads, and why unified views need incremental sync not iframe embeds.",
  date: "2026-03-03",
  tags: ["productivity","email","gmail","microsoft-outlook"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "cost",
      "title": "Switching cost"
    },
    {
      "id": "unify",
      "title": "What unification requires"
    }
  ],
  content: () => (
    <article>
      <P>Dual inbox tabs, missed threads, and why unified views need incremental sync not iframe embeds.</P>
      <P>These notes come from watching engineers lose commitments across Gmail, Outlook, and calendar tabs — and from building workflows that keep capture and execution in one place.</P>

      <H2 id="cost">Switching cost</H2>
      <P>Consultants and founders on two accounts check one, forget the other. Unread counts diverge.</P>
      <P>Mental model splits — &#39;did they reply on work or client mail?&#39;</P>

      <H2 id="unify">What unification requires</H2>
      <P>Normalised list + incremental cursors both sides + clear provider badge.</P>
      <P>Embed webmail in iframe avoids sync but kills search and task extraction — false economy.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/why-inbox-zero-fails-engineers">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
