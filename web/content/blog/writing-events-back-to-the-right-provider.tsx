import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "writing-events-back-to-the-right-provider",
  title: "Writing Calendar Events Back to the Right Provider",
  description: "Create on Google when only Google connected, Teams when Microsoft — default provider logic for mixed integrations.",
  date: "2026-05-26",
  tags: ["calendar","engineering","google-calendar","microsoft-outlook"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "default",
      "title": "Default provider"
    },
    {
      "id": "create",
      "title": "Create path"
    }
  ],
  content: () => (
    <article>
      <P>Create on Google when only Google connected, Teams when Microsoft — default provider logic for mixed integrations.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="default">Default provider</H2>
      <P>buildMeetingDraft: teams if Microsoft integration else google.</P>
      <P>Agent told not to ask which calendar — product picks from connected accounts.</P>

      <H2 id="create">Create path</H2>
      <P>Use organiser&#39;s token for provider API. Invitees on other stack get email invite — standard ICS flow.</P>
      <P>Store source + sourceId on created row for future sync.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/email-notification-batching">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
