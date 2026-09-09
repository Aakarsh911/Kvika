import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "ai-consent-before-processing-mail",
  title: "AI Consent Before Processing Mail and Calendar Data",
  description: "Explicit opt-in for features that send user content to models — gating extract, agent, and compose endpoints consistently.",
  date: "2025-11-11",
  tags: ["ai","privacy","security","compliance"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "why",
      "title": "Why explicit consent"
    },
    {
      "id": "surface",
      "title": "Consistent gating"
    },
    {
      "id": "revoke",
      "title": "Revocation"
    }
  ],
  content: () => (
    <article>
      <P>Explicit opt-in for features that send user content to models — gating extract, agent, and compose endpoints consistently.</P>
      <P>These notes come from watching engineers lose commitments across Gmail, Outlook, and calendar tabs — and from building workflows that keep capture and execution in one place.</P>

      <H2 id="why">Why explicit consent</H2>
      <P>OAuth for mail read ≠ consent for third-party LLM processing. Regulators and enterprise buyers ask.</P>
      <P>Settings toggle with timestamp; API returns AI_CONSENT_REQUIRED until granted.</P>

      <H2 id="surface">Consistent gating</H2>
      <P>Agent route, extract-from-emails, chat — all call requireAIConsent(session.email) early.</P>
      <P>Mixed gating confuses security review: &#39;sometimes data leaves, sometimes not&#39;.</P>

      <H2 id="revoke">Revocation</H2>
      <P>Disabling consent stops new LLM calls; does not delete prior tasks. Document retention separately.</P>
      <P>Clear copy: what leaves, which provider, retention period.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/deduping-ai-extracted-tasks">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
