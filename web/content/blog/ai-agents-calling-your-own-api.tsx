import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "ai-agents-calling-your-own-api",
  title: "AI Agents Calling Your Own API: Lambda to Next.js Internal Routes",
  description: "Bedrock action groups invoke Lambdas that POST to internal compose/meeting routes with shared-secret auth and userEmail propagation.",
  date: "2025-12-02",
  tags: ["ai","aws","engineering","architecture"],
  author: "Kvika Team",
  readTime: "7 min",
  sections: [
    {
      "id": "bridge",
      "title": "The bridge pattern"
    },
    {
      "id": "auth",
      "title": "Shared secret auth"
    },
    {
      "id": "extract",
      "title": "extractInput variance"
    },
    {
      "id": "deploy",
      "title": "Agent version pinning"
    }
  ],
  content: () => (
    <article>
      <P>Bedrock action groups invoke Lambdas that POST to internal compose/meeting routes with shared-secret auth and userEmail propagation.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="bridge">The bridge pattern</H2>
      <P>Agent runtime cannot run inside your Next.js VPC. Lambdas call CHRONOFLOW_INTERNAL_BASE_URL with x-chronoflow-agent-secret.</P>
      <P>Body includes userEmail from sessionAttributes — same code paths as UI, no duplicate business logic.</P>

      <H2 id="auth">Shared secret auth</H2>
      <P>INTERNAL_AGENT_SECRET must match Lambda env and web verifyInternalAgentRequest. Rotate together.</P>
      <P>Mismatch = 401 on every tool — silent in agent trace until you read logs.</P>

      <H2 id="extract">extractInput variance</H2>
      <P>Bedrock sends OpenAPI property arrays or JSON body. Normalise both before Zod validation.</P>
      <P>Reply flow reads emailId from promptSessionAttributes when agent omits params.</P>

      <H2 id="deploy">Agent version pinning</H2>
      <P>Hash instructions/schema into alias description to force new published version on deploy.</P>
      <P>Without it alias stays on first version — prompt fixes never reach prod.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/redis-caching-for-mail-and-tasks">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
