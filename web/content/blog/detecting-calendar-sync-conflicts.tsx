import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "detecting-calendar-sync-conflicts",
  title: "Detecting Calendar Sync Conflicts Before You Overwrite User Edits",
  description: "When modifiedLocally meets an external change to the same event — mark CONFLICT instead of silently picking a winner.",
  date: "2025-08-12",
  tags: ["calendar","sync","engineering","conflict-resolution"],
  author: "Kvika Team",
  readTime: "6 min",
  sections: [
    {
      "id": "scenario",
      "title": "The scenario"
    },
    {
      "id": "detection",
      "title": "Detection"
    },
    {
      "id": "future",
      "title": "What full reconciliation needs"
    }
  ],
  content: () => (
    <article>
      <P>When modifiedLocally meets an external change to the same event — mark CONFLICT instead of silently picking a winner.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="scenario">The scenario</H2>
      <P>User drags focus block later in your app. Google Calendar still has the old slot until push runs. Pull sync sees time mismatch on an event flagged modifiedLocally.</P>
      <P>Blind overwrite discards user intent. Blind ignore leaves external truth stale.</P>

      <H2 id="detection">Detection</H2>
      <P>Compare start/end from provider against local row when modifiedLocally is true. External time change → SyncStatus.CONFLICT with human-readable syncError.</P>
      <P>Do not auto-merge times; surface UI for pick local vs external.</P>

      <H2 id="future">What full reconciliation needs</H2>
      <P>Version vectors or updated timestamps from both sides. Many integrations stop at detection — still better than silent loss.</P>
      <P>Reconciliation jobs for CONFLICT rows are the next maturity step.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/which-calendar-events-can-be-moved">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
