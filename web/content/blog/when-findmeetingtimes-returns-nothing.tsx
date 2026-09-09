import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "when-findmeetingtimes-returns-nothing",
  title: "When findMeetingTimes Returns Nothing Useful",
  description: "emptySuggestionsReason, attendee token gaps, and the manual calendar scan fallback — debugging Graph scheduling in production.",
  date: "2025-10-07",
  tags: ["microsoft-outlook","scheduling","engineering","debugging"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "reasons",
      "title": "Common reasons"
    },
    {
      "id": "debug",
      "title": "Debug checklist"
    },
    {
      "id": "fallback",
      "title": "Fallback value"
    }
  ],
  content: () => (
    <article>
      <P>emptySuggestionsReason, attendee token gaps, and the manual calendar scan fallback — debugging Graph scheduling in production.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="reasons">Common reasons</H2>
      <P>Attendee without connected integration — excluded silently if you only query connected users.</P>
      <P>Time window too narrow, duration longer than free gaps, or activityDomain work excluding evenings users wanted.</P>

      <H2 id="debug">Debug checklist</H2>
      <P>Log requestBody and emptySuggestionsReason. Verify each attendee email resolves to a token.</P>
      <P>Try widening daysAhead and lowering maxCandidates constraints temporarily to isolate data vs config bugs.</P>

      <H2 id="fallback">Fallback value</H2>
      <P>Manual intersection of calendarView events respects showAs. Skip weekends in slot iterator.</P>
      <P>Label results source: graph vs manual so support knows which path fired.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/cross-org-free-busy-scheduling">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
