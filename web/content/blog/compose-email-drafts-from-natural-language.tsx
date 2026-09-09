import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "compose-email-drafts-from-natural-language",
  title: "Compose Email Drafts From Natural Language Context",
  description: "resolveRecipient, tone maps, and LLM body generation — separating address resolution from prose generation.",
  date: "2025-12-23",
  tags: ["ai","email","engineering","ux"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "split",
      "title": "Split responsibilities"
    },
    {
      "id": "tone",
      "title": "Tone control"
    },
    {
      "id": "review",
      "title": "Human review"
    }
  ],
  content: () => (
    <article>
      <P>resolveRecipient, tone maps, and LLM body generation — separating address resolution from prose generation.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="split">Split responsibilities</H2>
      <P>Backend resolves name → email before prompt. Model writes body with greetingName — not To: headers in body.</P>
      <P>MISSING recipient returns structured code for person picker UI.</P>

      <H2 id="tone">Tone control</H2>
      <P>professional | casual | friendly | formal maps to prompt adjectives — not separate models.</P>
      <P>Subject optional; model can infer from context when blank.</P>

      <H2 id="review">Human review</H2>
      <P>Always show draft card before send. Agent never sends autonomously in v1.</P>
      <P>PersonRecipientInput typeahead for correction when matched: false.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/handling-multi-step-agent-requests">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
