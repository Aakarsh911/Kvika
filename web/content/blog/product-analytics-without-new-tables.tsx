import type { BlogPost } from "@/lib/blog"
import { Codeblock, H2, H3, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "product-analytics-without-new-tables",
  title: "Product Analytics Without New Database Tables",
  description:
    "Focus hours, meeting load, task sources, and integration health — computed from CalendarEvent, Task, and CalendarSync rows you already have, with rule-based insights instead of a metrics warehouse.",
  date: "2026-05-15",
  tags: ["analytics", "engineering", "productivity", "sql"],
  author: "Kvika Team",
  readTime: "7 min",
  sections: [
    { id: "constraint", title: "Ship without a migration" },
    { id: "kpis", title: "KPIs from existing rows" },
    { id: "hours", title: "Clipping event hours to windows" },
    { id: "insights", title: "Rule-based insights" },
    { id: "quality", title: "Garbage in, garbage out" },
  ],
  content: () => (
    <article>
      <P>
        Users asked for a productivity dashboard — focus time vs meetings, tasks completed, where
        work comes from. We did not want a six-week analytics schema project blocking the feature.
        The data already existed in calendar events synced from Google and Microsoft, tasks from
        email AI and manual entry, and integration sync metadata.
      </P>
      <P>
        <code>getUserAnalytics</code> runs parallel Prisma queries for the selected week or month,
        aggregates in TypeScript, and returns KPIs plus plain-English insights. No new tables. No
        nightly ETL. This post is what that compromise looks like.
      </P>

      <H2 id="constraint">Ship without a migration</H2>
      <P>
        Analytics payloads are computed at request time. Acceptable for beta scale; revisit caching
        when dashboard load becomes hot. The tradeoff: ship now, optimise when metrics prove useful.
      </P>
      <P>
        Week vs month toggles use date-fns bounds with Monday week start. Each KPI includes a delta
        string comparing current period to the previous period — &quot;+2.3h vs last week&quot; —
        not just absolute numbers.
      </P>

      <H2 id="kpis">KPIs from existing rows</H2>
      <P>
        <strong>Focus hours:</strong> sum duration of events where{" "}
        <code>eventType === FOCUS_TIME</code>, clipped to the query window.
      </P>
      <P>
        <strong>Meeting hours:</strong> same for <code>MEETING</code>.
      </P>
      <P>
        <strong>Tasks completed:</strong> rows with <code>completedAt</code> in range, or legacy{" "}
        <code>status === Done</code> with <code>updatedAt</code> in range for older data.
      </P>
      <P>
        <strong>Email-sourced tasks:</strong> percentage of completed tasks where{" "}
        <code>source === EMAIL_AI</code>.
      </P>

      <H2 id="hours">Clipping event hours to windows</H2>
      <Codeblock language="typescript">{`function sumEventHours(events, windowStart, windowEnd) {
  return events.reduce((sum, event) => {
    const start = event.startTime < windowStart ? windowStart : event.startTime
    const end = event.endTime > windowEnd ? windowEnd : event.endTime
    if (end <= start) return sum
    return sum + (end - start) / (1000 * 60 * 60)
  }, 0)
}`}</Codeblock>
      <P>
        Events spanning week boundaries contribute partial hours — not zero, not double-counted across
        periods. All-day events need separate handling; duration math on them is misleading.
      </P>

      <H2 id="insights">Rule-based insights</H2>
      <P>
        We generate at most four insights from heuristics — no ML:
      </P>
      <P>
        Best focus day in the period. Busiest meeting day. Stale open tasks (not updated in 7+
        days). Integration sync errors from <code>CalendarSync.lastSyncError</code>.
      </P>
      <Callout type="info">
        Users trust &quot;12 open tasks older than 14 days&quot; more than opaque productivity scores.
        Explainable beats clever.
      </Callout>

      <H2 id="quality">Garbage in, garbage out</H2>
      <P>
        Analytics reads <code>eventType</code> assigned at calendar sync time via keyword heuristics
        and attendee checks. Misclassified meetings inflate focus hours or vice versa. Fixing
        classification improves dashboards and auto-scheduling simultaneously.
      </P>
      <P>
        Meeting pattern charts bucket by <code>startTime.getHours()</code> in server timezone today
        — a known gap for global users. Integration health rows surface last successful sync and
        error strings as reconnect prompts, not empty charts.
      </P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related:{" "}
        <A href="/blog/bidirectional-calendar-sync-without-losing-edits">calendar sync and classification</A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
