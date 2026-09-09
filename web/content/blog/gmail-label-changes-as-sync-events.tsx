import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "gmail-label-changes-as-sync-events",
  title: "Gmail Label Changes as Sync Events",
  description: "labelAdded and labelRemoved in history API — why read/unread must incrementally update without full fetch.",
  date: "2026-06-16",
  tags: ["gmail","email","sync","engineering"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "types",
      "title": "History types"
    },
    {
      "id": "fetch",
      "title": "Refetch on label change"
    }
  ],
  content: () => (
    <article>
      <P>labelAdded and labelRemoved in history API — why read/unread must incrementally update without full fetch.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="types">History types</H2>
      <P>history.list with messageAdded, messageDeleted, labelAdded, labelRemoved.</P>
      <P>Star/unread/archive all move labels — UI unread count depends on it.</P>

      <H2 id="fetch">Refetch on label change</H2>
      <P>Add message id to changed set; messages.get format full or metadata.</P>
      <P>Cheaper than re-listing entire inbox.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/graph-api-pagination-footguns">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
