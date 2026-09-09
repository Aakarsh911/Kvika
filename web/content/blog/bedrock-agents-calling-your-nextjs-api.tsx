import type { BlogPost } from "@/lib/blog"
import { Codeblock, H2, H3, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "bedrock-agents-calling-your-nextjs-api",
  title: "Bedrock Agents Calling Your Next.js API",
  description:
    "AWS Bedrock action groups invoke Lambdas that POST to internal compose, meeting, and Jira routes — shared-secret auth, userEmail propagation, and why we never duplicated business logic in Lambda.",
  date: "2026-01-15",
  tags: ["ai", "aws", "bedrock", "engineering", "architecture"],
  author: "Kvika Team",
  readTime: "8 min",
  sections: [
    { id: "split", title: "Why the agent is not in Next.js" },
    { id: "bridge", title: "Lambda as HTTP bridge" },
    { id: "auth", title: "Shared secret and user identity" },
    { id: "deploy", title: "Agent version pinning" },
    { id: "tools", title: "Adding a new tool" },
  ],
  content: () => (
    <article>
      <P>
        We wanted an AI agent that composes email, schedules meetings, and drafts Jira tickets using
        the same code paths as the web UI — same Zod validation, same name resolution, same provider
        defaults. Bedrock Agents run in AWS. Our business logic runs in Next.js. Something has to
        bridge them.
      </P>
      <P>
        Action group Lambdas are thin HTTP clients. They POST to internal routes on our deployed app
        with a shared secret header and the user&apos;s email from Bedrock session attributes. No
        duplicate compose logic in Lambda. This post is that architecture.
      </P>

      <H2 id="split">Why the agent is not in Next.js</H2>
      <P>
        Bedrock Agents provide session memory, tool orchestration, and trace output natively. Running
        the full agent loop inside a serverless Next.js route would mean reimplementing orchestration,
        managing long-running streams, and coupling deploy cycles to model changes.
      </P>
      <P>
        Lambdas handle action group invocation — Bedrock calls Lambda with OpenAPI-shaped events;
        Lambda calls us back. The Next.js app remains the source of truth for permissions, Prisma,
        and OAuth tokens.
      </P>

      <H2 id="bridge">Lambda as HTTP bridge</H2>
      <Codeblock language="javascript">{`// action-utils.mjs
export async function callInternalApi(path, body) {
  const response = await fetch(\`\${CHRONOFLOW_INTERNAL_BASE_URL}\${path}\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-chronoflow-agent-secret': INTERNAL_AGENT_SECRET,
    },
    body: JSON.stringify(body),
  })
  return response.json()
}`}</Codeblock>
      <P>
        Gmail actions call <code>/api/internal/ai/compose-email</code> or reply routes. Meeting
        actions call meeting prep. Jira actions call ticket draft. Each internal route verifies the
        secret via <code>verifyInternalAgentRequest</code> before running the same handlers the UI
        would trigger.
      </P>
      <P>
        <code>extractInput</code> normalises Bedrock event shape variance — sometimes JSON body,
        sometimes OpenAPI property arrays. Zod schemas run after normalisation.
      </P>

      <H2 id="auth">Shared secret and user identity</H2>
      <P>
        <code>INTERNAL_AGENT_SECRET</code> must match exactly between Lambda env and the web app.
        Mismatch → 401 on every tool → agent apologises generically while logs show auth failure.
      </P>
      <P>
        <code>userEmail</code> comes from <code>sessionAttributes</code> or{" "}
        <code>promptSessionAttributes</code> set when the web app invokes the agent. Compose and
        meeting prep use it for OAuth token lookup and attendee resolution. Missing email → tools
        fail closed.
      </P>
      <Callout type="info">
        <code>CHRONOFLOW_INTERNAL_BASE_URL</code> must be publicly reachable from Lambda — localhost
        does not work in production action groups.
      </Callout>

      <H2 id="deploy">Agent version pinning</H2>
      <P>
        Bedrock aliases pin to the first published agent version unless you force republish. We hash
        instructions, OpenAPI schemas, and model ID into the alias description so CDK deploys bump
        the version when prompts change. Without this, prompt fixes never reach prod.
      </P>

      <H2 id="tools">Adding a new tool</H2>
      <P>
        The checklist is deliberate: extend OpenAPI in CDK, implement Lambda handler calling internal
        API, add Zod schema on the route, register mapper in <code>agent-tool-mappers.ts</code>,
        add UI card in the chat drawer. Skipping the mapper means trace extraction succeeds but
        nothing renders.
      </P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Next:{" "}
        <A href="/blog/deduplicating-bedrock-agent-trace-results">trace deduplication</A>
        {" · "}
        <A href="/blog/multi-tool-ai-agent-requests">multi-tool requests</A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
