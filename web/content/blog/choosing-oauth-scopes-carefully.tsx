import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "choosing-oauth-scopes-carefully",
  title: "Choosing OAuth Scopes Carefully for Calendar and Mail Products",
  description: "Minimum viable permissions, offline_access, and why admin-consent scopes kill SMB adoption.",
  date: "2026-04-07",
  tags: ["oauth","security","engineering","google"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "minimum",
      "title": "Minimum viable"
    },
    {
      "id": "offline",
      "title": "offline_access"
    },
    {
      "id": "admin",
      "title": "Admin consent scopes"
    }
  ],
  content: () => (
    <article>
      <P>Minimum viable permissions, offline_access, and why admin-consent scopes kill SMB adoption.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="minimum">Minimum viable</H2>
      <P>Calendar read for sync; Mail.Read for inbox; write scopes only when sending/creating.</P>
      <P>Each extra scope drops conversion on consent screen.</P>

      <H2 id="offline">offline_access</H2>
      <P>Without refresh tokens Microsoft sessions die in ~1 hour.</P>
      <P>Google access_type offline on first connect — re-auth if refresh missing.</P>

      <H2 id="admin">Admin consent scopes</H2>
      <P>Directory search may need admin approval — degrade to calendar-mined contacts gracefully.</P>
      <P>Document which features need which scope tier.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/free-busy-vs-full-calendar-sharing">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
