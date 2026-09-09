import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "handling-multi-step-agent-requests",
  title: "Handling Multi-Step Agent Requests in One Turn",
  description: "'Email Alex and schedule a meeting' — prompt instructions, trace extraction arrays, and avoiding duplicate cards.",
  date: "2025-12-16",
  tags: ["ai","engineering","productivity"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "prompt",
      "title": "Prompt contract"
    },
    {
      "id": "route",
      "title": "API response shape"
    },
    {
      "id": "dedupe",
      "title": "Trace dedupe"
    }
  ],
  content: () => (
    <article>
      <P>&#39;Email Alex and schedule a meeting&#39; — prompt instructions, trace extraction arrays, and avoiding duplicate cards.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="prompt">Prompt contract</H2>
      <P>MULTI-TOOL: invoke every applicable tool in same turn. Runtime prompt repeats with name-resolution hint.</P>
      <P>Stopping after first tool is model laziness — reinforce in system and alias instructions.</P>

      <H2 id="route">API response shape</H2>
      <P>When clientActions.length &gt; 0, skip text-only fallback. Include messages joined or per-index.</P>
      <P>UI handleAgentClientActions loops types — compose then schedule in one assistant bubble group.</P>

      <H2 id="dedupe">Trace dedupe</H2>
      <P>Same tool output may appear in multiple trace nodes. Fingerprint by action + salient fields before push to array.</P>
      <P>Without dedupe users see twin drafts — looks like bugs, not thoroughness.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/mapping-agent-tools-to-ui-cards">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
