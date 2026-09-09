import type { BlogPost } from "@/lib/blog"
import { Codeblock, H2, H3, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "deduplicating-bedrock-agent-trace-results",
  title: "Deduplicating Bedrock Agent Trace Results",
  description:
    "One user message produced two email drafts and two meeting cards. The agent did not call tools twice — the trace tree echoed the same Lambda JSON in four places. How we parse and fingerprint tool output.",
  date: "2026-02-15",
  tags: ["ai", "bedrock", "engineering", "debugging"],
  author: "Kvika Team",
  readTime: "7 min",
  sections: [
    { id: "symptom", title: "Duplicate UI cards" },
    { id: "trace", title: "Where tool output actually lives" },
    { id: "walker", title: "The trace walker" },
    { id: "fingerprint", title: "Semantic fingerprints" },
    { id: "priority", title: "Trace beats assistant text" },
  ],
  content: () => (
    <article>
      <P>
        A user asked to send an email and schedule a meeting in one sentence. The agent invoked both
        tools correctly. The UI showed two email draft cards and two meeting scheduler cards. Logs
        showed one invocation each. We spent an hour tweaking prompts before checking the trace
        parser.
      </P>
      <P>
        Bedrock Agent trace trees are not a clean list of tool results. The same Lambda JSON appears
        under <code>actionGroupInvocationOutput.text</code>, nested{" "}
        <code>responseBody[&quot;application/json&quot;].body</code>, and again in child nodes. A
        naive recursive walk counts every appearance. This post is how we fixed that.
      </P>

      <H2 id="symptom">Duplicate UI cards</H2>
      <P>
        Multi-tool turns return <code>clientActions[]</code> to the chat drawer — one structured card
        per action. Email draft, meeting scheduler, Jira ticket. When the array contains duplicates,
        users assume the agent is broken or over-eager.
      </P>
      <P>
        The model was fine. The extractor counted echoes.
      </P>

      <H2 id="trace">Where tool output actually lives</H2>
      <P>
        With <code>enableTrace: true</code>, <code>invokeAgent</code> streams events. Tool payloads
        may appear as:
      </P>
      <P>
        Raw JSON in <code>actionGroupInvocationOutput.text</code>. Wrapped in API Gateway shape under{" "}
        <code>responseBody</code>. String <code>body</code> or <code>text</code> fields on nested
        objects. No published schema guarantees one path.
      </P>
      <P>
        We unwrap known shapes into a flat <code>{'{ action: &quot;show_new_email_draft&quot;, ... }'}</code>{" "}
        before mapping to UI types.
      </P>

      <H2 id="walker">The trace walker</H2>
      <Codeblock language="typescript">{`function walk(node) {
  if (!node || seenNodes.has(node)) return
  seenNodes.add(node)

  if (node.actionGroupInvocationOutput?.text)
    pushUniqueInvocationText(text, ...)

  if (node.responseBody?.['application/json']?.body)
    pushUniquePayload(unwrapped, ...)

  for (const value of Object.values(node))
    if (typeof value === 'object') walk(value)
}`}</Codeblock>
      <P>
        Cycle detection via <code>seenNodes</code> prevents infinite loops on circular trace
        references. First dedupe layer: normalised invocation text — identical raw strings skipped.
      </P>

      <H2 id="fingerprint">Semantic fingerprints</H2>
      <P>
        Second dedupe layer: action-specific fingerprints so structurally identical payloads from
        different trace paths collapse to one card:
      </P>
      <Codeblock language="typescript">{`case 'show_new_email_draft':
  return \`\${action}|\${to}|\${subject}|\${body.slice(0, 200)}\`
case 'show_meeting_scheduler':
  return \`\${action}|\${title}|\${startTime}|\${endTime}|\${JSON.stringify(attendees)}\``}</Codeblock>
      <P>
        Too coarse a fingerprint merges distinct drafts; too fine misses dedupe. Email body prefix
        at 200 chars was the sweet spot for compose actions.
      </P>
      <Callout type="tip">
        Instruct the agent not to echo tool JSON in final assistant text. Dual extraction (trace +
        text parse) can still duplicate if the model disobeys — trace path is primary.
      </Callout>

      <H2 id="priority">Trace beats assistant text</H2>
      <P>
        The agent route calls <code>extractToolResultsFromTrace</code> first. If{" "}
        <code>clientActions.length &gt; 0</code>, return those — skip parsing markdown JSON from the
        model&apos;s prose. Fallback <code>extractAgentClientAction</code> handles legacy sessions
        where trace walking missed a shape.
      </P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related:{" "}
        <A href="/blog/bedrock-agents-calling-your-nextjs-api">agent architecture</A>
        {" · "}
        <A href="/blog/multi-tool-ai-agent-requests">multi-tool turns</A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
