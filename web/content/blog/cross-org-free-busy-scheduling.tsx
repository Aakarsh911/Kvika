import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "cross-org-free-busy-scheduling",
  title: "Cross-Org Free/Busy Without Calendar Admin Access",
  description: "Finding mutual slots when each attendee owns their own Microsoft token — findMeetingTimes, fallbacks, and minimumAttendeePercentage.",
  date: "2025-09-30",
  tags: ["scheduling","microsoft-outlook","engineering","teams"],
  author: "Kvika Team",
  readTime: "7 min",
  sections: [
    {
      "id": "tokens",
      "title": "One token per attendee"
    },
    {
      "id": "findMeetingTimes",
      "title": "findMeetingTimes"
    },
    {
      "id": "fallback",
      "title": "Manual fallback"
    },
    {
      "id": "timezone",
      "title": "Timezone honesty"
    }
  ],
  content: () => (
    <article>
      <P>Finding mutual slots when each attendee owns their own Microsoft token — findMeetingTimes, fallbacks, and minimumAttendeePercentage.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="tokens">One token per attendee</H2>
      <P>You cannot read everyone&#39;s calendar with the organiser&#39;s token alone in mixed org setups.</P>
      <P>Look up Integration by attendee email; each connected member contributes their Graph client.</P>

      <H2 id="findMeetingTimes">findMeetingTimes</H2>
      <P>POST /me/findMeetingTimes with attendees[], timeConstraint, meetingDuration PT30M, minimumAttendeePercentage 100.</P>
      <P>returnSuggestionReasons helps debug emptySuggestionsReason in logs.</P>

      <H2 id="fallback">Manual fallback</H2>
      <P>When API returns zero suggestions, fetch calendarView per attendee, iterate business hours, test overlap on busy/tentative/oof.</P>
      <P>Expensive but saves the feature when Graph heuristics disagree with reality.</P>

      <H2 id="timezone">Timezone honesty</H2>
      <P>Pass explicit timeZone on constraint slots. &#39;3 PM&#39; without zone still causes pain — UI must confirm offset.</P>
      <P>Manual fallback appending Z to dateTime is fragile; prefer organiser IANA zone where possible.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related reading:{" "}
        <A href="/blog/scheduling-across-google-and-microsoft-teams">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
