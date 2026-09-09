import type { BlogPost } from "@/lib/blog"
import { Codeblock, H2, H3, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "llm-meeting-times-without-timezone-bugs",
  title: "LLM Meeting Times Without Timezone Bugs",
  description:
    "When the model returns 2025-06-09T14:00 with no Z, calling toISOString() schedules the wrong meeting. Wall-clock local strings and explicit offset handling in meeting drafts.",
  date: "2026-04-15",
  tags: ["ai", "scheduling", "timezones", "engineering"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    { id: "bug", title: "The 2pm → 9am bug" },
    { id: "local", title: "Wall-clock local path" },
    { id: "explicit", title: "Explicit offsets honoured" },
    { id: "agent", title: "Agent timezone vs draft builder" },
    { id: "attendees", title: "Sanitising model output" },
  ],
  content: () => (
    <article>
      <P>
        User: &quot;Schedule a meeting tomorrow at 2pm.&quot; Model:{" "}
        <code>2025-06-10T14:00</code>. Developer: <code>new Date(...).toISOString()</code>.
        Calendar invite: 9:00 AM. Trust: gone.
      </P>
      <P>
        LLMs output ISO-like datetimes without timezone suffixes. JavaScript interprets those as
        local time in the runtime environment — often UTC on the server — then converts to ISO UTC
        for storage. The user&apos;s wall clock and the stored instant diverge. We fixed this in
        meeting draft construction, not in the prompt alone.
      </P>

      <H2 id="bug">The 2pm → 9am bug</H2>
      <P>
        The failure is subtle because some inputs work. Strings with <code>Z</code> or{" "}
        <code>+05:30</code> parse correctly. Bare local datetimes do not. The scheduler UI displays
        what you store — if storage shifted the instant, every downstream API (Google Calendar create,
        Teams meeting) inherits the error.
      </P>

      <H2 id="local">Wall-clock local path</H2>
      <P>
        <code>normalizeLocalDateTime</code> regex-matches{" "}
        <code>YYYY-MM-DDTHH:mm</code> when no explicit timezone suffix is present. Those strings
        pass through unchanged as opaque wall-clock values:
      </P>
      <Codeblock language="typescript">{`const EXPLICIT_TZ = /[zZ]|[+-]\\d{2}:?\\d{2}$/

function normalizeLocalDateTime(raw: string): string | null {
  if (EXPLICIT_TZ.test(raw.trim())) return null // use Date path
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) return null
  return \`\${year}-\${month}-\${day}T\${hour}:\${minute}\`
}

// End time: add minutes via UTC component arithmetic — no zone shift
endTime = addMinutesToLocalDateTime(localStart, durationMinutes)`}</Codeblock>
      <P>
        The UI renders these as the user intended &quot;2pm&quot; without the server imposing its
        UTC offset.
      </P>

      <H2 id="explicit">Explicit offsets honoured</H2>
      <P>
        When the model includes <code>Z</code> or an offset, we use the Date parsing path and{" "}
        <code>toISOString()</code> — the model explicitly anchored the instant.
      </P>
      <Callout type="tip">
        Agent runtime prompt injects <code>timeZone</code> and <code>currentTime</code> from the
        browser. That helps the model — but server-side normalisation still must handle malformed
        output.
      </Callout>

      <H2 id="agent">Agent timezone vs draft builder</H2>
      <P>
        Split-brain risk: agent knows user TZ from session; meeting draft builder historically did
        not receive it on every path. Wall-clock preservation reduces dependence on server TZ but
        calendar create APIs still need an IANA zone at write time. Document which layer owns zone
        when pushing to Google or Microsoft.
      </P>
      <P>
        Unparseable garbage falls back to now + one hour rounded — log when fallback fires; it hides
        model errors.
      </P>

      <H2 id="attendees">Sanitising model output</H2>
      <P>
        Models emit <code>[aakarsh]</code>, quoted names, or comma-separated strings where arrays
        are expected. <code>normalizeAttendeeText</code> strips brackets and quotes before{" "}
        <code>resolveAttendees</code> runs — same names-to-emails pipeline as compose.
      </P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related:{" "}
        <A href="/blog/resolving-colleagues-by-name-not-email">name resolution</A>
        {" · "}
        <A href="/blog/when-findmeetingtimes-returns-empty">scheduling slots</A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
