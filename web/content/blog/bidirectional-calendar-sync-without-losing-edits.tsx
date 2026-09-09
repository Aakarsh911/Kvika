import type { BlogPost } from "@/lib/blog"
import { Codeblock, H2, H3, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "bidirectional-calendar-sync-without-losing-edits",
  title: "Bidirectional Calendar Sync Without Losing User Edits",
  description:
    "modifiedLocally, CONFLICT status, and scoped delete reconciliation — how we sync Google and Outlook calendars while letting users drag events and an algorithm reschedule focus blocks.",
  date: "2025-08-15",
  tags: ["calendar", "sync", "engineering", "google-calendar", "microsoft-outlook"],
  author: "Kvika Team",
  readTime: "8 min",
  sections: [
    { id: "pull-push", title: "Pull sync meets local edits" },
    { id: "modifiedLocally", title: "The modifiedLocally flag" },
    { id: "conflicts", title: "Detecting conflicts without CRDTs" },
    { id: "scoped-delete", title: "Scoped delete reconciliation" },
    { id: "classify", title: "Classification drives what can move" },
  ],
  content: () => (
    <article>
      <P>
        A unified calendar is not read-only. Users drag focus blocks. A rescheduling algorithm
        moves manageable events to open gaps. Changes need to push back to Google or Microsoft.
        Meanwhile, pull sync runs on a schedule and imports whatever changed externally.
      </P>
      <P>
        Without explicit rules, pull sync clobbers local edits. Or local edits fight external
        truth silently. We do not have CRDTs or operational transforms for calendar events — we
        have flags, conflict markers, and a delete reconciliation function with a scary footgun we
        almost shipped. This post explains the patterns that kept us honest.
      </P>

      <H2 id="pull-push">Pull sync meets local edits</H2>
      <P>
        Our sync loop fetches events from Google and Microsoft into a normalised{" "}
        <code>CalendarEvent</code> table. Each row has a composite unique key:{" "}
        <code>userId + source + sourceId</code>. Upserts are idempotent — overlapping cron jobs and
        manual refreshes do not create duplicate meetings.
      </P>
      <P>
        When the user reschedules an event in Kvika, we PATCH the row, set{" "}
        <code>modifiedLocally: true</code>, and mark <code>syncStatus: PENDING</code>. A separate
        push job writes the change to the external calendar. Until push succeeds, pull sync must not
        blindly overwrite title, start, or end times.
      </P>

      <H2 id="modifiedLocally">The modifiedLocally flag</H2>
      <P>
        On pull, if <code>modifiedLocally</code> is false, we compare incoming provider data with
        the stored row and update when title, start, end, or location changed. If nothing changed,
        we touch <code>lastSyncedAt</code> only.
      </P>
      <P>
        If <code>modifiedLocally</code> is true, we skip the normal update path. Instead we check
        whether the external calendar also changed times — which means two editors disagreed:
      </P>
      <Codeblock language="typescript">{`if (existing.modifiedLocally) {
  const externalTimeChanged =
    existing.startTime.getTime() !== eventData.startTime.getTime() ||
    existing.endTime.getTime() !== eventData.endTime.getTime()

  if (externalTimeChanged) {
    await prisma.calendarEvent.update({
      where: { id: existing.id },
      data: {
        syncStatus: SyncStatus.CONFLICT,
        syncError: 'Event was modified both locally and externally',
      },
    })
  }
  // do not overwrite local times
}`}</Codeblock>
      <Callout type="tip">
        Detection without auto-merge is enough for v1. Surface CONFLICT in the UI and let the user
        pick a winner. Silent merge picks wrong half the time.
      </Callout>

      <H2 id="conflicts">Detecting conflicts without CRDTs</H2>
      <P>
        Full bidirectional sync with conflict resolution is a research topic. Product-grade v1 needs
        three things: do not overwrite local edits on pull, detect when both sides changed the same
        field, and show humans a choice.
      </P>
      <P>
        We compare timestamps on start/end only for conflict detection — not title or attendees yet.
        Shallow comparison misses some drift but avoids noise from cosmetic external edits. Push
        failures set <code>syncStatus: ERROR</code> with the provider error string so support can
        distinguish &quot;conflict&quot; from &quot;token expired.&quot;
      </P>

      <H2 id="scoped-delete">Scoped delete reconciliation</H2>
      <P>
        After upserting fetched events, we reconcile deletions: remove DB rows whose{" "}
        <code>sourceId</code> no longer appears in the provider response. The naive version deletes
        any missing ID. That deleted next month&apos;s meetings when this week&apos;s sync window
        did not include them.
      </P>
      <P>
        <code>cleanupDeletedEvents</code> scopes candidates to the fetched date range and skips rows
        with <code>modifiedLocally: true</code>:
      </P>
      <Codeblock language="typescript">{`const where = {
  userId,
  source,
  modifiedLocally: false,
  AND: [
    { startTime: { gte: startDate } },
    { endTime: { lte: endDate } },
  ],
}

// delete DB events in window whose sourceId ∉ externalEventIds`}</Codeblock>
      <P>
        This function exists because we thought about the scary case before production, not after.
        If your sync fetches a sliding window, your delete logic must use the same window.
      </P>

      <H2 id="classify">Classification drives what can move</H2>
      <P>
        Not every event should be draggable by an algorithm. We classify on import: external
        attendees → <code>MEETING</code>; focus keywords in title → <code>FOCUS_TIME</code>; task
        keywords → <code>TASK</code>; else <code>PERSONAL</code>.
      </P>
      <P>
        <code>isEventManageable</code> returns false for meetings with anyone other than the user
        on the guest list. Focus and task blocks default to manageable. The rescheduling algorithm
        only PATCHes events where <code>isManaged</code> is true and the user opted in.
      </P>
      <P>
        Classification quality downstream affects analytics too — focus hours KPIs read{" "}
        <code>eventType</code> from these same rows. Bad heuristics mean bad dashboards, not just
        bad auto-scheduling.
      </P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        See also:{" "}
        <A href="/blog/syncing-google-and-microsoft-calendars-programmatically">
          incremental calendar sync patterns
        </A>
        {" · "}
        <A href="/blog/which-calendar-events-can-move">which events the algorithm may move</A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
