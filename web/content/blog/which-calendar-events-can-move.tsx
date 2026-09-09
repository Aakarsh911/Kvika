import type { BlogPost } from "@/lib/blog"
import { Codeblock, H2, H3, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "which-calendar-events-can-move",
  title: "Which Calendar Events Can an Algorithm Move?",
  description:
    "External attendees stay fixed. Focus blocks move. The isEventManageable rules and isManaged opt-in that keep automatic rescheduling from cancelling your client call.",
  date: "2026-07-15",
  tags: ["calendar", "scheduling", "engineering", "productivity"],
  author: "Kvika Team",
  readTime: "7 min",
  sections: [
    { id: "promise", title: "Automatic schedule repair" },
    { id: "classify", title: "Classification on import" },
    { id: "manageable", title: "isEventManageable rules" },
    { id: "opt-in", title: "User opt-in with isManaged" },
    { id: "push", title: "Push back to Google and Outlook" },
  ],
  content: () => (
    <article>
      <P>
        Smart calendars promise to protect focus time by moving your own blocks around meetings. The
        product soul is not the optimiser — it is knowing which blocks must never move. Move a client
        call because title keywords looked like focus time and you are done.
      </P>
      <P>
        Kvika classifies events on sync, marks manageability, lets users opt in per event, and only
        then allows drag or algorithm PATCH. This post is the rules engine, not the solver.
      </P>

      <H2 id="promise">Automatic schedule repair</H2>
      <P>
        The rescheduling algorithm (first-fit gap search today) finds open slots and PATCHes events
        where <code>isManaged</code> is true and <code>isEventManageable</code> returned true on
        import. Meetings with guests outside the user are never candidates — coordination cost is
        not something to hide.
      </P>

      <H2 id="classify">Classification on import</H2>
      <P>
        On every sync from Google or Microsoft:
      </P>
      <P>
        Any attendee email ≠ user → <code>MEETING</code>. Title contains focus/deep work keywords →{" "}
        <code>FOCUS_TIME</code>. Task/todo keywords → <code>TASK</code>. Else{" "}
        <code>PERSONAL</code>.
      </P>
      <P>
        Keywords bootstrap; users can override types in UI. Analytics dashboards read the same{" "}
        <code>eventType</code> field — classification quality is shared infrastructure.
      </P>

      <H2 id="manageable">isEventManageable rules</H2>
      <Codeblock language="typescript">{`if (eventType === MEETING && hasExternalAttendees) return false
if (eventType === FOCUS_TIME || eventType === TASK) return true
// PERSONAL: only if zero attendees or solo self-invite
return attendees.length === 0 || soloSelfAttendee`}</Codeblock>
      <P>
        All-day events and provider immovable flags need explicit UI blocks — edit dialog rejects
        reschedule for unsupported shapes today.
      </P>
      <Callout type="info">
        &quot;Review&quot; in a title might be performance review (immovable) or code review block
        (movable). Keywords misclassify; user override matters.
      </Callout>

      <H2 id="opt-in">User opt-in with isManaged</H2>
      <P>
        Event creation dialog includes &quot;Allow Kvika to reschedule this event.&quot; Import sets{" "}
        <code>isManaged</code> from manageability heuristics; user toggles refine. Drag in the grid
        sets <code>modifiedLocally</code> and triggers push — see{" "}
        <A href="/blog/bidirectional-calendar-sync-without-losing-edits">bidirectional sync post</A>.
      </P>

      <H2 id="push">Push back to Google and Outlook</H2>
      <P>
        Local PATCH is not enough. Push job writes to the source provider; until success, pull sync
        must respect <code>modifiedLocally</code>. Failed push → <code>syncStatus: ERROR</code> with
        provider message. Conflict → user picks winner.
      </P>
      <P>
        TODO still open: delete in Kvika should delete externally — today local delete may orphan
        provider copies. Bidirectional sync is a roadmap, not a checkbox.
      </P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related:{" "}
        <A href="/blog/bidirectional-calendar-sync-without-losing-edits">sync and conflicts</A>
        {" · "}
        <A href="/blog/product-analytics-without-new-tables">analytics from event types</A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
