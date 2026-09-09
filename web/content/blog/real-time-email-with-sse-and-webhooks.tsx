import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "real-time-email-with-sse-and-webhooks",
  title: "Real-Time Email with SSE and Webhooks",
  description: "Bridging Gmail Pub/Sub and Microsoft Graph subscriptions to browser updates — and why in-memory SSE registries do not scale horizontally yet.",
  date: "2025-07-08",
  tags: ["email","engineering","webhooks","sse","real-time"],
  author: "Kvika Team",
  readTime: "7 min",
  sections: [
    {
      "id": "push",
      "title": "Provider push models"
    },
    {
      "id": "sse",
      "title": "SSE to the browser"
    },
    {
      "id": "limits",
      "title": "Single-node limits"
    },
    {
      "id": "microsoft-202",
      "title": "Why Microsoft webhooks return 202 on errors"
    }
  ],
  content: () => (
    <article>
      <P>Bridging Gmail Pub/Sub and Microsoft Graph subscriptions to browser updates — and why in-memory SSE registries do not scale horizontally yet.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="push">Provider push models</H2>
      <P>Gmail uses Pub/Sub watch on the mailbox; notifications carry historyId hints. Graph uses subscriptions with validation tokens and renewal windows.</P>
      <P>Both require publicly reachable HTTPS endpoints and secrets verified on each delivery.</P>

      <H2 id="sse">SSE to the browser</H2>
      <P>Browsers connect to a text/event-stream endpoint. Server keeps a Map of clientId to enqueue functions. Webhook handlers broadcast &#123;type: new-email, provider&#125;.</P>
      <P>Keep-alive comments every 30s prevent proxies from closing idle connections. Clean up on abort.</P>

      <H2 id="limits">Single-node limits</H2>
      <P>global.mailClients works on one Node instance. Multi-instance deploys miss events unless you add Redis pub/sub between webhook workers and SSE nodes.</P>
      <P>Document this before scaling horizontally.</P>

      <H2 id="microsoft-202">Why Microsoft webhooks return 202 on errors</H2>
      <P>Graph retries failed deliveries aggressively. Returning 500 can amplify load during partial outages.</P>
      <P>Returning 202 drops a notification silently. Log hard, alert on rates, and run periodic delta catch-up as backstop.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/oauth-token-refresh-under-load">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
