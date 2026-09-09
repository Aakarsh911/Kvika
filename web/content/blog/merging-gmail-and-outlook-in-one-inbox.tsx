import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "merging-gmail-and-outlook-in-one-inbox",
  title: "Merging Gmail and Outlook in One Inbox View",
  description: "Two providers, two cursor types, two JSON shapes — patterns for a unified mail dashboard that stays consistent under incremental updates.",
  date: "2025-06-17",
  tags: ["gmail","microsoft-outlook","email","productivity","engineering"],
  author: "Kvika Team",
  readTime: "7 min",
  sections: [
    {
      "id": "shape",
      "title": "One row shape for two APIs"
    },
    {
      "id": "incremental",
      "title": "Incremental merge semantics"
    },
    {
      "id": "parallel-fetch",
      "title": "Parallel fetch with independent failure"
    },
    {
      "id": "realtime",
      "title": "Polling plus push"
    }
  ],
  content: () => (
    <article>
      <P>Two providers, two cursor types, two JSON shapes — patterns for a unified mail dashboard that stays consistent under incremental updates.</P>
      <P>These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems.</P>

      <H2 id="shape">One row shape for two APIs</H2>
      <P>Gmail gives snippet and labelIds; Graph gives bodyPreview and isRead. Normalise to id, subject, from &#123;name, address&#125;, receivedDateTime, provider, webLink before merge.</P>
      <P>Sort once by receivedDateTime descending. Provider badges help support but should not fork rendering logic.</P>

      <H2 id="incremental">Incremental merge semantics</H2>
      <P>Gmail deltas include explicit deletions. Outlook delta often upserts changed rows. Your merge layer must handle both: Map by ID, apply upserts, delete Gmail removed IDs, leave untouched rows alone.</P>
      <P>On first load or forceRefresh, replace the list. On incremental pass, patch in place to avoid scroll jump.</P>

      <H2 id="parallel-fetch">Parallel fetch with independent failure</H2>
      <P>Promise.all Gmail and Outlook fetches. If one provider fails, show partial results and surface reconnect for the failing side. All-or-nothing frustrates mixed-stack users.</P>
      <P>Track gmailHistoryId and outlookDeltaLink separately — they advance on different schedules.</P>

      <H2 id="realtime">Polling plus push</H2>
      <P>SSE or webhooks nudge the client to run an incremental pass. Avoid forceRefresh on every ping; that discards cursors and hammers APIs.</P>
      <P>Debounce rapid notifications. Three webhook fires in ten seconds should coalesce to one delta merge.</P>

      <Callout type="info">Users on both providers expect one unread count. Sum per-provider counts only after normalising read state.</Callout>

      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        Previous in series:{" "}
        <A href="/blog/outlook-delta-queries-for-email">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
