import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "linking-tasks-back-to-source-messages",
  title: "Linking Tasks Back to Source Messages",
  description: "url field to webLink, provider in sourceData — one click from task row to originating thread.",
  date: "2026-07-28",
  tags: ["tasks","ux","email","productivity"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "link",
      "title": "Deep links"
    },
    {
      "id": "teams",
      "title": "Teams messages"
    }
  ],
  content: () => (
    <article>
      <P>url field to webLink, provider in sourceData — one click from task row to originating thread.</P>
      <P>These notes come from watching engineers lose commitments across Gmail, Outlook, and calendar tabs — and from building workflows that keep capture and execution in one place.</P>

      <H2 id="link">Deep links</H2>
      <P>Gmail htmlLink and Outlook webLink on task.url.</P>
      <P>Context switch cost drops — no searching inbox by subject.</P>

      <H2 id="teams">Teams messages</H2>
      <P>Store team/channel/message ids in sourceData for future deep link when Graph supports stable URLs.</P>
      <P>Context string in UI: team · channel.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/task-source-attribution">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
