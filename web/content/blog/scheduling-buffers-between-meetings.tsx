import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "scheduling-buffers-between-meetings",
  title: "Scheduling Buffers Between Meetings",
  description: "Back-to-back video calls leave no transition time — calendar tools should treat buffers as first-class blocks.",
  date: "2026-03-17",
  tags: ["scheduling","calendar","productivity","remote-work"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "problem",
      "title": "The problem"
    },
    {
      "id": "practice",
      "title": "Practices"
    }
  ],
  content: () => (
    <article>
      <P>Back-to-back video calls leave no transition time — calendar tools should treat buffers as first-class blocks.</P>
      <P>These notes come from watching engineers lose commitments across Gmail, Outlook, and calendar tabs — and from building workflows that keep capture and execution in one place.</P>

      <H2 id="problem">The problem</H2>
      <P>Optimisers maximise utilisation; humans need bio and context switch time.</P>
      <P>Free slot at 2pm ignores 1:55pm hard stop from overrun.</P>

      <H2 id="practice">Practices</H2>
      <P>15-min after external meetings. Focus blocks before deep work, not after lunch only.</P>
      <P>Team policy beats individual heroics — shared quiet hours help.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/the-async-ask-buried-in-email">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
