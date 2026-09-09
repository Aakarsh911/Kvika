import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "security-of-server-side-oauth-tokens",
  title: "Security of Server-Side OAuth Tokens in a SaaS Inbox",
  description: "Encrypt at rest, never log access tokens, rotate refresh tokens — baseline for mail/calendar products.",
  date: "2026-08-04",
  tags: ["security","oauth","engineering","compliance"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "store",
      "title": "Storage"
    },
    {
      "id": "logs",
      "title": "Logging hygiene"
    }
  ],
  content: () => (
    <article>
      <P>Encrypt at rest, never log access tokens, rotate refresh tokens — baseline for mail/calendar products.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="store">Storage</H2>
      <P>Integration table per user per provider. Secrets in env, tokens in DB with encryption at rest.</P>
      <P>Export-data route lets users leave — deletion must revoke and wipe tokens.</P>

      <H2 id="logs">Logging hygiene</H2>
      <P>Log historyId and deltaLink prefixes, not mail bodies in prod.</P>
      <P>Agent internal routes verify shared secret header on every call.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/linking-tasks-back-to-source-messages">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
