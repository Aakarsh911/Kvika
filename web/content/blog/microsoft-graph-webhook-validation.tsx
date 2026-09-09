import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "microsoft-graph-webhook-validation",
  title: "Microsoft Graph Webhook Validation and Subscription Lifecycle",
  description: "validationToken handshakes, clientState checks, and why subscription renewal cannot be an afterthought.",
  date: "2025-07-22",
  tags: ["microsoft-outlook","webhooks","graph-api","engineering"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "validation",
      "title": "The validation handshake"
    },
    {
      "id": "clientstate",
      "title": "clientState verification"
    },
    {
      "id": "renewal",
      "title": "Renewal debt"
    }
  ],
  content: () => (
    <article>
      <P>validationToken handshakes, clientState checks, and why subscription renewal cannot be an afterthought.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="validation">The validation handshake</H2>
      <P>Graph sends validationToken as query param on subscription create. Respond 200 text/plain with the token echoed exactly.</P>
      <P>JSON responses fail validation and subscriptions never activate.</P>

      <H2 id="clientstate">clientState verification</H2>
      <P>Set clientState when creating subscriptions. Reject notifications that do not match your secret prefix.</P>
      <P>Prevents stray deliveries from old environments hitting prod handlers.</P>

      <H2 id="renewal">Renewal debt</H2>
      <P>Mail subscriptions often expire in hours unless renewed. Store subscriptionId mapped to userId in DB — TODO in many codebases for a reason.</P>
      <P>Without renewal, webhooks stop silently; polling or delta catch-up becomes the real sync mechanism.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/gmail-pubsub-watch-setup">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
