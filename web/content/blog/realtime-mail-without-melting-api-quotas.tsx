import type { BlogPost } from "@/lib/blog"
import { Codeblock, H2, H3, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "realtime-mail-without-melting-api-quotas",
  title: "Real-Time Mail Without Melting Your API Quotas",
  description:
    "Gmail Pub/Sub, Microsoft Graph webhooks, and a unified SSE channel — layered with incremental sync and polling so near-live inboxes do not devolve into full fetches every thirty seconds.",
  date: "2025-11-15",
  tags: ["email", "webhooks", "engineering", "real-time", "sse"],
  author: "Kvika Team",
  readTime: "8 min",
  sections: [
    { id: "layers", title: "Three layers of freshness" },
    { id: "sse", title: "One SSE endpoint for both providers" },
    { id: "gmail-push", title: "Gmail Pub/Sub watch" },
    { id: "outlook-hook", title: "Outlook webhooks" },
    { id: "scale", title: "Single-node limits" },
  ],
  content: () => (
    <article>
      <P>
        Users expect mail to feel live. They also expect you not to burn their OAuth quota on full
        inbox pulls every time they blink. Real-time mail is a layering problem: push notifications
        tell you something changed; incremental sync tells you what; SSE tells the browser to refresh
        the merge — not replace the entire list from scratch.
      </P>
      <P>
        Kvika bridges Gmail Pub/Sub and Microsoft Graph subscriptions through one Server-Sent Events
        endpoint. The architecture works on a single Node process today. Scaling it taught us where
        the seams are.
      </P>

      <H2 id="layers">Three layers of freshness</H2>
      <P>
        <strong>Layer 1 — push.</strong> Gmail sends Pub/Sub messages with{" "}
        <code>emailAddress</code> and <code>historyId</code>. Outlook POSTs change notifications to
        your webhook URL. Both mean &quot;invalidate cache and notify clients&quot; — not &quot;fetch
        every message body now.&quot;
      </P>
      <P>
        <strong>Layer 2 — incremental fetch.</strong> On notification (or 30-second poll as
        backstop), run Gmail <code>history.list</code> or Outlook delta with stored cursors. Merge
        into the in-memory list via Map upsert/delete.
      </P>
      <P>
        <strong>Layer 3 — SSE to browser.</strong> Connected clients receive{" "}
        <code>{'{"type":"new-email","provider":"gmail"}'}</code> and trigger an incremental pass —
        not <code>forceRefresh</code> on every ping.
      </P>
      <Callout type="info">
        Debounce rapid notifications. Label sync can fire dozens of webhooks in ten seconds;
        coalesce to one merge.
      </Callout>

      <H2 id="sse">One SSE endpoint for both providers</H2>
      <P>
        Browsers connect to <code>/api/mail/events</code>. We register each connection in{" "}
        <code>global.mailClients</code> — a Map from clientId to an enqueue function writing to a{" "}
        <code>TransformStream</code>:
      </P>
      <Codeblock language="typescript">{`global.mailClients.set(clientId, {
  controller: { enqueue: (data) => writer.write(encoder.encode(data)) },
  userId: session.user.email,
})

// Keep-alive every 30s; clean up on abort
writer.write(': keep-alive\\n\\n')`}</Codeblock>
      <P>
        Headers matter behind nginx: <code>Cache-Control: no-cache</code>,{" "}
        <code>X-Accel-Buffering: no</code>. Without them, events buffer until the connection closes
        and &quot;real-time&quot; becomes batch.
      </P>

      <H2 id="gmail-push">Gmail Pub/Sub watch</H2>
      <P>
        <code>users.watch</code> registers INBOX changes against a Cloud Pub/Sub topic. Google
        returns <code>historyId</code> and an expiration (~7 days). Renew on connect and via cron
        for active users.
      </P>
      <P>
        The push handler decodes the Pub/Sub payload, maps email address to user, invalidates Redis{" "}
        <code>emails:&#123;userId&#125;:*</code>, and notifies only SSE clients whose{" "}
        <code>userId</code>{" "}
        matches — targeted fanout.
      </P>

      <H2 id="outlook-hook">Outlook webhooks</H2>
      <P>
        Subscription creation returns a validation token you must echo as plain text — JSON responses
        fail handshake. Notifications include <code>clientState</code>; verify it matches your secret
        prefix before processing.
      </P>
      <P>
        We return HTTP 202 even on processing errors. Microsoft retries aggressively on 5xx; during
        partial outages that amplifies load. Log hard, alert on rates, rely on delta catch-up as
        backstop.
      </P>
      <P>
        Known gap: subscriptions expire in roughly four hours and renewal is not fully wired to
        per-user DB storage yet. Polling remains the real sync mechanism for many Outlook users until
        renewal ships.
      </P>

      <H2 id="scale">Single-node limits</H2>
      <P>
        <code>global.mailClients</code> works on one Node instance. Horizontal scaling drops events
        unless webhooks publish to Redis pub/sub and each SSE node subscribes. Outlook webhooks
        currently broadcast to all connected clients — Gmail filters by email address; Outlook does
        not yet map subscriptionId → userId.
      </P>
      <P>
        Document these limits before scaling. Real-time mail is not free — it is push + incremental
        + debounce, not push + full fetch.
      </P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related:{" "}
        <A href="/blog/building-a-unified-gmail-outlook-inbox">unified inbox sync</A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
