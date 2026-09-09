import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "teams-directory-search-permissions",
  title: "Teams Directory Search When Permissions Are Limited",
  description: "joinedTeams + members works for many users; org-wide search fails closed — graceful degradation paths.",
  date: "2026-06-23",
  tags: ["microsoft-teams","engineering","oauth","ux"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "teams",
      "title": "Team-scoped directory"
    },
    {
      "id": "fail",
      "title": "When org search fails"
    }
  ],
  content: () => (
    <article>
      <P>joinedTeams + members works for many users; org-wide search fails closed — graceful degradation paths.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="teams">Team-scoped directory</H2>
      <P>/me/joinedTeams then /teams/&#123;id&#125;/members — cap teams at 5 for latency.</P>
      <P>Fetch /users/&#123;id&#125; for mail when member payload lacks email.</P>

      <H2 id="fail">When org search fails</H2>
      <P>$search denied → startswith filter → calendar contacts → unmatched picker.</P>
      <P>Never block compose entirely on directory denial.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/gmail-label-changes-as-sync-events">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
