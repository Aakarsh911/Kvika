import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "gmail-pubsub-watch-setup",
  title: "Setting Up Gmail Pub/Sub Watch for Push Notifications",
  description: "users.watch, topic permissions, and storing historyId — the minimum viable Gmail push pipeline for a SaaS inbox.",
  date: "2025-07-15",
  tags: ["gmail","webhooks","engineering","google-cloud","email"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "watch",
      "title": "The watch call"
    },
    {
      "id": "push-handler",
      "title": "Push handler flow"
    },
    {
      "id": "historyid-split",
      "title": "Multiple historyId stores"
    }
  ],
  content: () => (
    <article>
      <P>users.watch, topic permissions, and storing historyId — the minimum viable Gmail push pipeline for a SaaS inbox.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="watch">The watch call</H2>
      <P>Call users.watch with topicName pointing at your Pub/Sub topic and labelIds for INBOX. Google returns expiration and historyId.</P>
      <P>Watches expire (~7 days). Renew on connect and via cron for active users.</P>

      <H2 id="push-handler">Push handler flow</H2>
      <P>Pub/Sub delivers base64 data with emailAddress and historyId. Decode, map address to user, invalidate cache, notify SSE clients.</P>
      <P>Do not fetch full mail in the webhook — enqueue incremental sync using the new historyId.</P>

      <H2 id="historyid-split">Multiple historyId stores</H2>
      <P>Watch setup may store historyId under one key; task extraction uses gmailHistoryId. Align keys or document which job owns which cursor.</P>
      <P>Split stores cause full re-fetch loops that look like sync bugs.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/real-time-email-with-sse-and-webhooks">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
