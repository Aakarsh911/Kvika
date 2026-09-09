import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "classifying-calendar-events-automatically",
  title: "Classifying Calendar Events: Meetings, Focus, Tasks, Personal",
  description: "Heuristics for tagging imported Google and Microsoft events so downstream scheduling knows what can move.",
  date: "2025-07-29",
  tags: ["calendar","engineering","productivity","google-calendar","microsoft-outlook"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "why",
      "title": "Why classification matters"
    },
    {
      "id": "rules",
      "title": "Rules that work in practice"
    },
    {
      "id": "limits",
      "title": "Limits of keywords"
    }
  ],
  content: () => (
    <article>
      <P>Heuristics for tagging imported Google and Microsoft events so downstream scheduling knows what can move.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="why">Why classification matters</H2>
      <P>A unified calendar is not just display. Rescheduling, analytics, and focus protection need to know whether a block is a client meeting or a self-owned focus session.</P>
      <P>Import everything as MEETING and your optimiser will never touch the right blocks.</P>

      <H2 id="rules">Rules that work in practice</H2>
      <P>External attendees → MEETING. Title contains focus/deep work → FOCUS_TIME. Task/todo keywords → TASK. Else PERSONAL.</P>
      <P>Organiser-only blocks with no guests often land as PERSONAL — good candidates for auto-move.</P>

      <H2 id="limits">Limits of keywords</H2>
      <P>&#39;Review&#39; in a title might be a performance review (immovable) or a code review block (movable). Keywords bootstrap; user overrides and isManaged flags refine.</P>
      <P>Store classification on sync; let users recategorise without fighting the next pull.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/microsoft-graph-webhook-validation">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
