import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "fuzzy-name-matching-for-attendees",
  title: "Fuzzy Name Matching for Attendee Lookup",
  description: "Why exact string match fails for first names, typos, and email local-parts — a simple scoring model that works.",
  date: "2025-09-23",
  tags: ["engineering","search","microsoft-teams","ux"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "failures",
      "title": "Exact match failures"
    },
    {
      "id": "model",
      "title": "Scoring model"
    },
    {
      "id": "threshold",
      "title": "When to refuse"
    }
  ],
  content: () => (
    <article>
      <P>Why exact string match fails for first names, typos, and email local-parts — a simple scoring model that works.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="failures">Exact match failures</H2>
      <P>&#39;Sarah&#39; vs &#39;Sarah Chen&#39;. &#39;john&#39; vs john.doe@company.com. Case and token boundaries break naive includes().</P>
      <P>Typeahead needs ranked results, not first match.</P>

      <H2 id="model">Scoring model</H2>
      <P>Normalise lowercase trim. Split displayName on whitespace for token tests.</P>
      <P>100 exact full string, 90 token equals query, 70 token prefix, 50 substring. Email local-part 95 on equality.</P>

      <H2 id="threshold">When to refuse</H2>
      <P>Common first names at score 50 can wrong-match. Pair low confidence with UI disambiguation.</P>
      <P>searchPeople merges team + calendar + org, sorts by score, returns top 8.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/contact-directory-from-past-meetings">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
