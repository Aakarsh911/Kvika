import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "mapping-agent-tools-to-ui-cards",
  title: "Mapping Agent Tool Results to UI Cards",
  description: "Registry pattern: tool payload action strings become typed clientActions — email draft, meeting scheduler, Jira ticket.",
  date: "2025-12-09",
  tags: ["ai","frontend","engineering","ux"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "registry",
      "title": "Registry"
    },
    {
      "id": "trace",
      "title": "Trace vs text"
    },
    {
      "id": "multi",
      "title": "Multiple cards per turn"
    }
  ],
  content: () => (
    <article>
      <P>Registry pattern: tool payload action strings become typed clientActions — email draft, meeting scheduler, Jira ticket.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="registry">Registry</H2>
      <P>agent-tool-mappers maps show_new_email_draft, show_meeting_scheduler, etc. to &#123;type, props&#125; + user message.</P>
      <P>Adding a tool = Lambda response shape + mapper + drawer component — comment at top of file lists all four.</P>

      <H2 id="trace">Trace vs text</H2>
      <P>Prefer extractToolResultsFromTrace over parsing assistant JSON. Model instructed not to echo tool JSON.</P>
      <P>Legacy extractAgentClientAction still parses fenced JSON for older sessions.</P>

      <H2 id="multi">Multiple cards per turn</H2>
      <P>Return clientActions[] and clientActionMessages[]. Drawer renders N cards — one message each.</P>
      <P>Single clientAction field kept for backwards compatibility.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/ai-agents-calling-your-own-api">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
