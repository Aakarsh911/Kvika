import type { BlogPost } from "@/lib/blog"
import { Codeblock, H2, H3, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "batch-ai-task-extraction-from-email",
  title: "Batch AI Task Extraction From Email",
  description:
    "One LLM call per ten emails, temporary IDs in prompts, conservative confidence thresholds, and human-review-friendly task creation — how we extract action items without spamming false positives.",
  date: "2025-12-15",
  tags: ["ai", "email", "tasks", "engineering", "gemini"],
  author: "Kvika Team",
  readTime: "7 min",
  sections: [
    { id: "problem", title: "The triage tax" },
    { id: "batch", title: "Why batch, not per-email" },
    { id: "prompt", title: "Temp IDs and conservative extraction" },
    { id: "persist", title: "Task rows with source links" },
    { id: "gates", title: "Consent and rate limits" },
  ],
  content: () => (
    <article>
      <P>
        Manual inbox triage does not scale on release weeks. AI extraction promises to read mail and
        surface action items — but one false positive per day trains users to ignore the feature.
        One missed email trains them to leave.
      </P>
      <P>
        Our email extraction pipeline batches messages to the LLM, maps results back to real message
        IDs, dedupes on persist, and only advances mail sync cursors after the full run succeeds.
        This post is about the extraction layer specifically — not fetch, not cursor commit (see{" "}
        <A href="/blog/sync-cursors-and-ai-pipelines">sync cursors and AI pipelines</A>).
      </P>

      <H2 id="problem">The triage tax</H2>
      <P>
        Action items hide in polite mid-paragraph asks, forwarded threads with no owner, and calendar
        invites with implicit prep. Engineers already have Jira for sprint work and Slack for urgent
        pings. Email is the leak.
      </P>
      <P>
        Extraction should propose tasks with title, priority, optional due date, and a link back to
        the original thread — not silently create fifty rows while the user sleeps.
      </P>

      <H2 id="batch">Why batch, not per-email</H2>
      <P>
        We chunk fetched mail into batches of ten and call{" "}
        <code>extractTasksFromEmailsBatch</code> once per chunk. Sequential per-email calls multiply
        latency, cold-start cost, and rate-limit surface area.
      </P>
      <P>
        Batches log index and total (<code>batch 2/5</code>) so support can correlate timeouts with
        payload size. If one batch throws, the entire request fails and mail cursors do not advance —
        the user gets a retry, not silent loss.
      </P>

      <H2 id="prompt">Temp IDs and conservative extraction</H2>
      <P>
        Gmail and Outlook message IDs are long opaque strings. Models corrupt them. In the batch
        prompt we assign <code>email_1</code>, <code>email_2</code>, … and map back after parse:
      </P>
      <Codeblock language="typescript">{`// Prompt uses: ID: email_1, Subject: ..., Preview: ...
// Response: { "email_1": { tasks: [...], confidence: 0.82 } }
// Map email_1 → realMessages[0].id before create`}</Codeblock>
      <P>
        The prompt instructs conservative extraction: ignore newsletters, promos, automated shipping
        notifications, and casual threads without clear asks. Confidence below 0.6 drops the email
        from results. False negatives beat invented tasks.
      </P>
      <Callout type="tip">
        We extract from <code>bodyPreview</code> / snippet only today — not full MIME bodies. Tasks
        buried in attachments or trimmed HTML are a known gap.
      </Callout>

      <H2 id="persist">Task rows with source links</H2>
      <P>
        Created tasks use <code>source: EMAIL_AI</code>, <code>sourceId</code> set to the email ID,
        and <code>url</code> pointing to Gmail <code>htmlLink</code> or Outlook <code>webLink</code>.
        <code>sourceData</code> JSON stores subject, from, provider, confidence, and extraction
        timestamp for audit.
      </P>
      <P>
        Dedupe before insert: same user, same email ID, same title → skip. Retries after cursor
        deferral re-hit the same mail safely.
      </P>

      <H2 id="gates">Consent and rate limits</H2>
      <P>
        Mail content leaves the VPC only after <code>requireAIConsent</code> passes. Without opt-in,
        the API returns <code>AI_CONSENT_REQUIRED</code> — not a silent skip.
      </P>
      <P>
        Rate limit: six extractions per minute per user. Enough for manual triggers; blocks runaway
        loops from buggy clients. Return <code>retryAfterSeconds</code> on 429.
      </P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related:{" "}
        <A href="/blog/stop-losing-action-items-in-your-inbox">why inbox task capture fails</A>
        {" · "}
        <A href="/blog/sync-cursors-and-ai-pipelines">cursor commit ordering</A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
