import type { BlogPost } from "@/lib/blog"
import { Codeblock, H2, H3, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "multi-tool-ai-agent-requests",
  title: "Multi-Tool AI Agent Requests in One Turn",
  description:
    "'Email Alex and book a meeting' — prompt contracts, clientActions arrays, mapper registries, and why stopping after the first tool is a model habit you have to break.",
  date: "2026-08-15",
  tags: ["ai", "bedrock", "engineering", "ux"],
  author: "Kvika Team",
  readTime: "7 min",
  sections: [
    { id: "request", title: "Combined requests are normal" },
    { id: "prompt", title: "Prompt contract" },
    { id: "response", title: "API response shape" },
    { id: "mappers", title: "Mapper registry" },
    { id: "dedupe", title: "Trace dedupe still required" },
  ],
  content: () => (
    <article>
      <P>
        Users do not speak in single intents. &quot;Email Kinshuok about the doc and schedule a sync
        for Thursday&quot; is one message. If your agent stops after the first tool call, half the
        request vanishes — and users blame the product, not the model&apos;s laziness.
      </P>
      <P>
        Multi-tool support spans Bedrock instructions, runtime prompt, API response shape, trace
        extraction, and chat UI rendering. Remove any layer and combined requests regress silently.
      </P>

      <H2 id="request">Combined requests are normal</H2>
      <P>
        Early agent versions had hardcoded single-intent bypasses — compose OR meeting, detected by
        regex before Bedrock. That broke combined requests and duplicated logic. Everything now flows
        through the agent: tools return structured payloads; the web app maps them to UI cards.
      </P>

      <H2 id="prompt">Prompt contract</H2>
      <P>
        System and alias instructions include explicit MULTI-TOOL language: invoke every applicable
        tool in the same turn. Runtime prompt repeats with name-resolution hint — pass raw attendee
        names, backend resolves emails.
      </P>
      <P>
        Also instruct: do not emit JSON tool results in assistant prose after calls; Kvika reads
        trace output. Model obedience reduces dual-path extraction bugs.
      </P>

      <H2 id="response">API response shape</H2>
      <Codeblock language="typescript">{`const toolResult = extractToolResultsFromTrace(result.traces)
if (toolResult.clientActions.length > 0) {
  return {
    message: toolResult.message,
    clientAction: toolResult.clientAction,       // last — backwards compat
    clientActions: toolResult.clientActions,     // all — multi-tool
    clientActionMessages: toolResult.messages, // one string per card
  }
}`}</Codeblock>
      <P>
        Chat drawer loops <code>clientActions</code> and renders compose card + meeting scheduler in
        one assistant turn. Single <code>clientAction</code> field preserved for older clients.
      </P>

      <H2 id="mappers">Mapper registry</H2>
      <P>
        <code>agent-tool-mappers.ts</code> maps Lambda payload <code>action</code> strings to typed{" "}
        <code>AgentClientAction</code> unions — <code>show_new_email_draft</code>,{" "}
        <code>show_meeting_scheduler</code>, <code>show_jira_ticket_draft</code>, etc. Adding a tool
        means four coordinated edits documented at the top of the file: OpenAPI, Lambda, mapper,
        UI component.
      </P>
      <Callout type="tip">
        Human review on every card — agent proposes draft, user confirms send/book/create. Multi-tool
        does not mean multi-autonomous side effect.
      </Callout>

      <H2 id="dedupe">Trace dedupe still required</H2>
      <P>
        Multi-tool increases trace size. Same payload echoed in nested nodes still produces duplicate
        cards without fingerprint dedupe — see{" "}
        <A href="/blog/deduplicating-bedrock-agent-trace-results">trace deduplication post</A>.
        Fingerprints are per action type; email drafts hash to + subject + body prefix.
      </P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related:{" "}
        <A href="/blog/bedrock-agents-calling-your-nextjs-api">agent architecture</A>
        {" · "}
        <A href="/blog/resolving-colleagues-by-name-not-email">name resolution</A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
