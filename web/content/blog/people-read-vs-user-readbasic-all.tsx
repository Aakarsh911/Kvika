import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "people-read-vs-user-readbasic-all",
  title: "People.Read vs User.ReadBasic.All in Practice",
  description: "Which Graph scopes unlock which lookup tiers — and what to do when enterprise admins say no.",
  date: "2026-06-30",
  tags: ["microsoft-outlook","oauth","security","engineering"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "scopes",
      "title": "Scope map"
    },
    {
      "id": "degrade",
      "title": "Degrade path"
    }
  ],
  content: () => (
    <article>
      <P>Which Graph scopes unlock which lookup tiers — and what to do when enterprise admins say no.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="scopes">Scope map</H2>
      <P>/me/people search needs People.Read. /users $search needs directory permissions.</P>
      <P>Calendar-mined contacts need only calendar data you already store.</P>

      <H2 id="degrade">Degrade path</H2>
      <P>Feature matrix doc: typeahead quality per scope tier.</P>
      <P>In-app copy when org blocks directory: &#39;Connect Teams or add emails manually&#39;.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/teams-directory-search-permissions">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
