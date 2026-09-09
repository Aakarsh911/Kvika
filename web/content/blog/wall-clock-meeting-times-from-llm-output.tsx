import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "wall-clock-meeting-times-from-llm-output",
  title: "Wall-Clock Meeting Times From LLM Output (Without Timezone Bugs)",
  description: "When the model returns 2025-06-09T14:00 without Z, calling toISOString() shifts the meeting. Keep local wall-clock strings instead.",
  date: "2025-10-14",
  tags: ["ai","scheduling","engineering","timezones"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "bug",
      "title": "The bug"
    },
    {
      "id": "fix",
      "title": "Local datetime path"
    },
    {
      "id": "mixed",
      "title": "Mixed inputs"
    },
    {
      "id": "attendees",
      "title": "Sanitise attendee strings"
    }
  ],
  content: () => (
    <article>
      <P>When the model returns 2025-06-09T14:00 without Z, calling toISOString() shifts the meeting. Keep local wall-clock strings instead.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="bug">The bug</H2>
      <P>User says &#39;schedule 2pm tomorrow&#39;. Model outputs ISO-like string without offset. new Date().toISOString() converts via server UTC — wrong wall clock in UI.</P>
      <P>Meeting invites show 9am instead of 2pm; trust dies.</P>

      <H2 id="fix">Local datetime path</H2>
      <P>Regex LOCAL_DATE_TIME for YYYY-MM-DDTHH:mm without trailing Z or offset. Treat as opaque local wall clock.</P>
      <P>addMinutesToLocalDateTime uses UTC arithmetic on components without shifting zone — display matches user intent.</P>

      <H2 id="mixed">Mixed inputs</H2>
      <P>Strings with Z go through Date parsing. Strings without go local path. Document in agent prompts: prefer explicit offsets when known.</P>
      <P>Fallback unparseable to now+1h rounded — log when fallback fires; it hides model errors.</P>

      <H2 id="attendees">Sanitise attendee strings</H2>
      <P>Models emit &#39;[name]&#39; or quoted strings. Strip brackets and quotes before resolveAttendees.</P>
      <P>Comma-separated single string should split to array in Lambda normalisation too.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/when-findmeetingtimes-returns-nothing">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
