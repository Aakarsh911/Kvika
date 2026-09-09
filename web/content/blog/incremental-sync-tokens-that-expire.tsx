import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "incremental-sync-tokens-that-expire",
  title: "Incremental Sync Tokens That Expire (and the 410 Gone Fallback)",
  description: "Google syncToken and Outlook deltaLink both go stale. Design full re-sync paths before users return from holiday.",
  date: "2025-08-26",
  tags: ["calendar","sync","google-calendar","microsoft-outlook","engineering"],
  author: "Kvika Team",
  readTime: "5 min",
  sections: [
    {
      "id": "google-410",
      "title": "Google 410 Gone"
    },
    {
      "id": "outlook-delta",
      "title": "Outlook invalid delta"
    },
    {
      "id": "ux",
      "title": "User-visible progress"
    }
  ],
  content: () => (
    <article>
      <P>Google syncToken and Outlook deltaLink both go stale. Design full re-sync paths before users return from holiday.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="google-410">Google 410 Gone</H2>
      <P>Long gaps invalidate syncToken. Catch 410, clear stored token, run bounded full list, persist nextSyncToken.</P>
      <P>Without fallback calendars freeze at last successful sync.</P>

      <H2 id="outlook-delta">Outlook invalid delta</H2>
      <P>Graph returns errors when deltaLink is too old or mailbox structure changed. Clear outlookMailDeltaLink and restart delta from filtered initial query.</P>
      <P>Same user experience: brief full sync, then incremental again.</P>

      <H2 id="ux">User-visible progress</H2>
      <P>Show &#39;catching up&#39; during full re-sync. Silent multi-minute loads feel broken.</P>
      <P>Rate-limit parallel calendar full syncs on login to protect Graph quotas.</P>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Related reading:{" "}
        <A href="/blog/syncing-google-and-microsoft-calendars-programmatically">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
