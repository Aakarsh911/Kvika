import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "contact-directory-from-past-meetings",
  title: "Building a Contact Directory From Past Meetings",
  description: "When Teams directory access fails, mine attendee lists from synced calendar events — zero new Graph scopes required.",
  date: "2025-09-16",
  tags: ["calendar","microsoft-teams","engineering","privacy"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "constraint",
      "title": "The scope constraint"
    },
    {
      "id": "implementation",
      "title": "Implementation"
    },
    {
      "id": "privacy",
      "title": "Privacy"
    }
  ],
  content: () => (
    <article>
      <P>When Teams directory access fails, mine attendee lists from synced calendar events — zero new Graph scopes required.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="constraint">The scope constraint</H2>
      <P>User.ReadBasic.All and directory search require admin consent in many tenants. Calendar read often already exists.</P>
      <P>Past meeting attendees are people the user already met — high precision for scheduling and compose.</P>

      <H2 id="implementation">Implementation</H2>
      <P>Query last 400 calendar events. Extract attendees JSON arrays. Dedupe by email lowercase. Keep displayName from first sighting.</P>
      <P>Merge with Teams directory results; higher score wins on conflict.</P>

      <H2 id="privacy">Privacy</H2>
      <P>Directory is per-user, built from their synced data — not a global tenant export.</P>
      <P>Still respect unmatched names: show picker, never auto-send to wrong address on low scores.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/resolving-email-recipients-by-name">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
