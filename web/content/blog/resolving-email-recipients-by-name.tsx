import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "resolving-email-recipients-by-name",
  title: "Resolving Email Recipients by Name (Not Address)",
  description: "Users say 'email Kinshuok' — tiered lookup across Teams, calendar history, and org directory with fuzzy scoring.",
  date: "2025-09-09",
  tags: ["email","microsoft-teams","engineering","ux"],
  author: "Kvika Team",
  readTime: "7 min",
  sections: [
    {
      "id": "problem",
      "title": "The UX problem"
    },
    {
      "id": "tiers",
      "title": "Three tiers"
    },
    {
      "id": "scoring",
      "title": "Fuzzy scoring"
    },
    {
      "id": "agent",
      "title": "Agent contract"
    }
  ],
  content: () => (
    <article>
      <P>Users say &#39;email Kinshuok&#39; — tiered lookup across Teams, calendar history, and org directory with fuzzy scoring.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="problem">The UX problem</H2>
      <P>Forcing address entry on compose breaks voice-style agent flows. Names are how humans refer to colleagues.</P>
      <P>Resolution must happen server-side with the user&#39;s OAuth context — never guess in the model alone.</P>

      <H2 id="tiers">Three tiers</H2>
      <P>Teams members from joinedTeams (cap teams scanned). Calendar contacts mined from last 400 events&#39; attendees — no extra scopes.</P>
      <P>Live org search via Graph $search on displayName, falling back to startswith when search is denied.</P>

      <H2 id="scoring">Fuzzy scoring</H2>
      <P>Exact token match scores 90. Prefix 70. Substring 50. Threshold 50 accepts; below returns matched: false for UI correction.</P>
      <P>Email local-part match can false-positive on short queries — prefer displayName when scores tie.</P>

      <H2 id="agent">Agent contract</H2>
      <P>Prompt the agent to pass raw names; backend resolves. OpenAPI must not require format: email on to fields or validation rejects valid flows.</P>
      <P>Compose and meeting prep share resolveAttendees — one directory, two surfaces.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/normalising-google-and-microsoft-event-shapes">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
