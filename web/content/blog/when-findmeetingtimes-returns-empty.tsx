import type { BlogPost } from "@/lib/blog"
import { Codeblock, H2, H3, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "when-findmeetingtimes-returns-empty",
  title: "When findMeetingTimes Returns Empty",
  description:
    "Microsoft Graph findMeetingTimes often returns zero suggestions. emptySuggestionsReason, per-attendee tokens, and the manual calendar grid fallback we built when the API gives up.",
  date: "2025-10-15",
  tags: ["scheduling", "microsoft-outlook", "graph-api", "engineering"],
  author: "Kvika Team",
  readTime: "7 min",
  sections: [
    { id: "promise", title: "What findMeetingTimes promises" },
    { id: "empty", title: "Why it returns nothing" },
    { id: "fallback", title: "Manual grid fallback" },
    { id: "limits", title: "What we still cannot do" },
  ],
  content: () => (
    <article>
      <P>
        Microsoft Graph exposes <code>/me/findMeetingTimes</code> — pass attendees, a time window, a
        duration, and get back ranked slots where everyone is free. On paper it replaces the seven-reply
        email thread. In production it returns an empty array often enough that you need a Plan B
        before launch.
      </P>
      <P>
        We call findMeetingTimes first. When <code>meetingTimeSuggestions</code> is empty, we log{" "}
        <code>emptySuggestionsReason</code>, fetch each attendee&apos;s calendar view with their own
        OAuth token, and brute-force a business-hours grid. Users still get slots. Support gets a
        <code>method: 'api' | 'manual'</code> flag to debug which path fired.
      </P>

      <H2 id="promise">What findMeetingTimes promises</H2>
      <P>
        Our request body includes <code>minimumAttendeePercentage: 100</code> (everyone must be
        free), <code>activityDomain: 'work'</code>, <code>meetingDuration: 'PT30M'</code>, and a{" "}
        <code>timeConstraint</code> window. We ask for up to twenty candidates with suggestion
        reasons returned.
      </P>
      <P>
        Attendees must be ChronoFlow users with connected Microsoft integrations — we look up each
        member&apos;s token by matching <code>integration.accountId</code> to the Teams member ID.
        External guests without a connected account are out of scope for this route today.
      </P>

      <H2 id="empty">Why it returns nothing</H2>
      <P>
        Common causes we see in logs:
      </P>
      <P>
        <strong>Attendee without a valid token.</strong> findMeetingTimes runs as the organiser. It
        cannot see calendars for members who have not connected Microsoft in Kvika — they drop out
        or produce empty free/busy.
      </P>
      <P>
        <strong>Window too narrow or duration too long.</strong> A thirty-minute meeting in a
        fifteen-minute gap returns nothing. So does searching only one afternoon when everyone is
        booked.
      </P>
      <P>
        <strong>Opaque Graph reasons.</strong> <code>emptySuggestionsReason</code> helps — log it
        alongside the request body on every empty response. Without it you are guessing.
      </P>
      <Callout type="tip">
        Date-specific search (<code>?date=2025-10-14</code>) constrains to 08:00–18:00 UTC on that
        day. Confirm timezone with the user in the UI — Graph defaults are not your user&apos;s
        wall clock.
      </Callout>

      <H2 id="fallback">Manual grid fallback</H2>
      <P>
        When suggestions length is zero, we fetch <code>/me/calendar/calendarView</code> per
        attendee for the same window, collect busy/tentative/oof events, and iterate a grid:
      </P>
      <Codeblock language="typescript">{`// Skip weekends; 9–17 local-ish hours; 30-min slots
for (each day in window) {
  for (hour = 9; hour < 17; hour++) {
    slot = { start: day at hour, duration }
    if (every attendee free at slot) suggestions.push(slot)
  }
}`}</Codeblock>
      <P>
        Overlap detection compares slot boundaries against each event&apos;s start/end, respecting{" "}
        <code>showAs</code> — free events do not block. Manual results carry{" "}
        <code>score: 'ManualAnalysis'</code> so the UI can label them differently if needed.
      </P>
      <P>
        This is expensive: N attendees × one calendarView call × hourly iteration. Acceptable as
        fallback, not as primary path. Cache attendee calendars within the request where possible.
      </P>

      <H2 id="limits">What we still cannot do</H2>
      <P>
        <strong>Google attendees on this route.</strong> findMeetingTimes is Microsoft-native. Mixed
        Google + Microsoft free/busy needs a separate integration path.
      </P>
      <P>
        <strong>User working hours.</strong> Fallback hardcodes business hours instead of reading{" "}
        <code>MailboxSettings</code> working hours per user.
      </P>
      <P>
        <strong>Cross-org calendar read.</strong> Fallback uses each attendee&apos;s own token. If
        their calendar is empty due to permissions, manual analysis finds false &quot;free&quot;
        slots too.
      </P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related:{" "}
        <A href="/blog/resolving-colleagues-by-name-not-email">name resolution for attendees</A>
        {" · "}
        <A href="/blog/scheduling-across-google-and-microsoft-teams">mixed-stack scheduling</A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
