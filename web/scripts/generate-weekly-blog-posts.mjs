#!/usr/bin/env node
/**
 * Generates weekly blog posts from 2025-06-03 through 2026-09-08.
 * Run: node web/scripts/generate-weekly-blog-posts.mjs
 */
import { writeFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, "../content/blog")

function dates() {
  const out = []
  const d = new Date("2025-06-03")
  const end = new Date("2026-09-08")
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 7)
  }
  return out
}

function esc(s) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$")
}

function getLead(topic) {
  if (topic.lead) return topic.lead
  if (topic.tags.includes("engineering")) {
    return "These patterns come from building and operating dual-provider mail, calendar sync, and AI-assisted task flows in production — written for engineers shipping similar systems."
  }
  return "These notes come from watching engineers lose commitments across Gmail, Outlook, and calendar tabs — and from building workflows that keep capture and execution in one place."
}

function jsxText(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;")
}

/** @type {Array<{slug:string,title:string,description:string,tags:string[],readTime:string,sections:{id:string,title:string,paras:string[]}[],callout?:{type:string,text:string},code?:string,related?:string}>} */
const TOPICS = [
  {
    slug: "gmail-historyid-incremental-sync",
    title: "Gmail historyId: Incremental Sync Without Re-fetching Your Inbox",
    description: "How Gmail's history API tracks messageAdded, messageDeleted, and label changes — and why it beats full inbox pulls for live mail views.",
    tags: ["gmail", "email", "engineering", "sync", "api"],
    readTime: "6 min",
    sections: [
      { id: "why-full-fetch-fails", title: "Why full inbox fetches do not scale", paras: ["Pulling every message on each page load works for prototypes. It breaks the moment users have thousands of threads, multiple tabs open, or a webhook that fires every few minutes.", "Gmail exposes incremental change tracking through historyId. Each mailbox state has a monotonic ID. Ask for changes since your last ID and you receive only what moved: new mail, deletions, label updates."] },
      { id: "history-types", title: "The history types that matter", paras: ["messageAdded and messageDeleted are obvious. labelAdded and labelRemoved matter too: marking read/unread or starring a message is a change your UI should reflect without re-downloading bodies.", "Collect changed message IDs into a set, fetch details in parallel, and return deletions separately so the client can remove them from local state."] },
      { id: "footguns", title: "Footguns in production", paras: ["historyId expires. Google may return 400 if you have not synced in too long. Catch that, fall back to a bounded full fetch, and store a fresh historyId.", "History can paginate. Large bursts (label sync, import) may span pages. Loop until historyId stabilises or you hit a safety cap."] },
      { id: "client-merge", title: "Merging deltas on the client", paras: ["Treat your in-memory list as a map keyed by message ID. Apply upserts for changed IDs, delete keys for removed IDs, re-sort by received time. Full replace is simpler but flickers on large inboxes.", "Persist historyId in integration metadata for server jobs; keep a copy in client state for interactive dashboards that poll or listen over SSE."] },
    ],
    callout: { type: "tip", text: "Invalidate your mail cache whenever validEmails.length > 0 or deletedMessageIds.size > 0. Partial updates still change what users see." },
  },
  {
    slug: "outlook-delta-queries-for-email",
    title: "Outlook Delta Queries: Incremental Mail Sync on Microsoft Graph",
    description: "Microsoft Graph delta links work differently from Gmail historyId. Here is how to fetch only changed messages and persist the cursor safely.",
    tags: ["microsoft-outlook", "email", "engineering", "graph-api", "sync"],
    readTime: "6 min",
    sections: [
      { id: "delta-basics", title: "How delta links work", paras: ["The first call hits a delta endpoint with filters — often today's inbox. Graph returns changed items plus @odata.deltaLink when the page completes.", "Subsequent syncs call the deltaLink URL directly. You receive upserts and removals since the last run without re-listing the folder."] },
      { id: "persist", title: "Where to store the cursor", paras: ["Store outlookMailDeltaLink on the user's Microsoft integration record. Passing it only via query params works for demos; server-side persistence survives refreshes and background jobs.", "Support deltaLink=clear to reset state when tokens rot or users report stale mail. Wipe the DB field and run an initial delta from scratch."] },
      { id: "persist-false", title: "Fetch now, persist later", paras: ["When downstream processing can fail — AI extraction, batch indexing — fetch with persist=false. Return the new deltaLink in the response but do not write it until processing succeeds.", "Otherwise a crash after fetch skips mail permanently. At-least-once processing needs at-least-once cursors."] },
      { id: "pagination", title: "Pagination you cannot skip", paras: ["@odata.nextLink and @odata.deltaLink serve different roles. deltaLink appears when a sync round completes. Following only the first page truncates busy inboxes.", "Production code should loop nextLink until deltaLink arrives, merging value arrays along the way."] },
    ],
  },
  {
    slug: "merging-gmail-and-outlook-in-one-inbox",
    title: "Merging Gmail and Outlook in One Inbox View",
    description: "Two providers, two cursor types, two JSON shapes — patterns for a unified mail dashboard that stays consistent under incremental updates.",
    tags: ["gmail", "microsoft-outlook", "email", "productivity", "engineering"],
    readTime: "7 min",
    sections: [
      { id: "shape", title: "One row shape for two APIs", paras: ["Gmail gives snippet and labelIds; Graph gives bodyPreview and isRead. Normalise to id, subject, from {name, address}, receivedDateTime, provider, webLink before merge.", "Sort once by receivedDateTime descending. Provider badges help support but should not fork rendering logic."] },
      { id: "incremental", title: "Incremental merge semantics", paras: ["Gmail deltas include explicit deletions. Outlook delta often upserts changed rows. Your merge layer must handle both: Map by ID, apply upserts, delete Gmail removed IDs, leave untouched rows alone.", "On first load or forceRefresh, replace the list. On incremental pass, patch in place to avoid scroll jump."] },
      { id: "parallel-fetch", title: "Parallel fetch with independent failure", paras: ["Promise.all Gmail and Outlook fetches. If one provider fails, show partial results and surface reconnect for the failing side. All-or-nothing frustrates mixed-stack users.", "Track gmailHistoryId and outlookDeltaLink separately — they advance on different schedules."] },
      { id: "realtime", title: "Polling plus push", paras: ["SSE or webhooks nudge the client to run an incremental pass. Avoid forceRefresh on every ping; that discards cursors and hammers APIs.", "Debounce rapid notifications. Three webhook fires in ten seconds should coalesce to one delta merge."] },
    ],
    callout: { type: "info", text: "Users on both providers expect one unread count. Sum per-provider counts only after normalising read state." },
  },
  {
    slug: "when-not-to-save-your-sync-cursor",
    title: "When Not to Save Your Sync Cursor",
    description: "Saving Gmail historyId or Outlook deltaLink immediately after fetch loses data when AI or batch jobs fail mid-pipeline. Commit cursors after processing completes.",
    tags: ["sync", "email", "engineering", "reliability", "ai"],
    readTime: "6 min",
    sections: [
      { id: "mirror-vs-process", title: "Mirror sync vs process-then-advance", paras: ["Mirror sync copies provider state to your DB. Advance the cursor when fetch succeeds. That is correct for caches.", "Process-then-advance runs extraction, enrichment, or billing on each batch. Advance only when the batch commits. Mixing the two patterns causes silent data loss."] },
      { id: "failure", title: "What failure looks like", paras: ["Fetch ten new emails. LLM times out on email seven. Cursor already saved. Those ten never re-enter the pipeline.", "Users see an empty task list and assume mail had nothing actionable. Support tickets follow."] },
      { id: "pattern", title: "The pattern that works", paras: ["Fetch with persist=false on Outlook. Hold newGmailHistoryId in memory. Run extraction. Dedupe tasks by sourceId and title. Then persist both cursors in one step.", "If extraction throws, cursors stay put. Retry reprocesses the same mail; dedupe prevents duplicate tasks."] },
      { id: "tradeoff", title: "Tradeoffs", paras: ["You may re-run LLM on overlap after failures. That costs tokens. Skipping mail costs trust.", "Make idempotency explicit in task creation, not just cursor storage."] },
    ],
  },
  {
    slug: "oauth-token-refresh-under-load",
    title: "OAuth Token Refresh Under Concurrent Load",
    description: "Multiple tabs, webhooks, and cron jobs refreshing the same Microsoft or Google token can race. Patterns for proactive refresh and safe persistence.",
    tags: ["oauth", "security", "engineering", "google", "microsoft-outlook"],
    readTime: "6 min",
    sections: [
      { id: "expiry", title: "Proactive vs reactive refresh", paras: ["Check expiresAt before each Graph or Gmail call. Refresh when now >= expiresAt, not only after 401.", "Reactive-only refresh feels fine until background jobs and UI requests hit the same expired token simultaneously."] },
      { id: "races", title: "Refresh races", paras: ["Two requests both see expiry, both refresh, both write Integration rows. Last write wins; refresh token rotation can invalidate the other session.", "Ideal fix: single-flight refresh per user+provider with a short lock. Minimum fix: refresh synchronously in one code path and reuse the updated row."] },
      { id: "listeners", title: "Fire-and-forget token listeners", paras: ["Google client libraries emit tokens mid-request. Persist in a void async handler but log failures loudly.", "Silent persistence failure means the next request uses stale DB tokens while memory had fresh ones."] },
      { id: "ux", title: "Reconnect UX", paras: ["Map invalid_grant and missing refresh_token to needsReauth: true. Generic 401 sends users in circles.", "Microsoft accounts go stale after admin policy changes. Surface which provider broke."] },
    ],
  },
  {
    slug: "real-time-email-with-sse-and-webhooks",
    title: "Real-Time Email with SSE and Webhooks",
    description: "Bridging Gmail Pub/Sub and Microsoft Graph subscriptions to browser updates — and why in-memory SSE registries do not scale horizontally yet.",
    tags: ["email", "engineering", "webhooks", "sse", "real-time"],
    readTime: "7 min",
    sections: [
      { id: "push", title: "Provider push models", paras: ["Gmail uses Pub/Sub watch on the mailbox; notifications carry historyId hints. Graph uses subscriptions with validation tokens and renewal windows.", "Both require publicly reachable HTTPS endpoints and secrets verified on each delivery."] },
      { id: "sse", title: "SSE to the browser", paras: ["Browsers connect to a text/event-stream endpoint. Server keeps a Map of clientId to enqueue functions. Webhook handlers broadcast {type: new-email, provider}.", "Keep-alive comments every 30s prevent proxies from closing idle connections. Clean up on abort."] },
      { id: "limits", title: "Single-node limits", paras: ["global.mailClients works on one Node instance. Multi-instance deploys miss events unless you add Redis pub/sub between webhook workers and SSE nodes.", "Document this before scaling horizontally."] },
      { id: "microsoft-202", title: "Why Microsoft webhooks return 202 on errors", paras: ["Graph retries failed deliveries aggressively. Returning 500 can amplify load during partial outages.", "Returning 202 drops a notification silently. Log hard, alert on rates, and run periodic delta catch-up as backstop."] },
    ],
  },
  {
    slug: "gmail-pubsub-watch-setup",
    title: "Setting Up Gmail Pub/Sub Watch for Push Notifications",
    description: "users.watch, topic permissions, and storing historyId — the minimum viable Gmail push pipeline for a SaaS inbox.",
    tags: ["gmail", "webhooks", "engineering", "google-cloud", "email"],
    readTime: "5 min",
    sections: [
      { id: "watch", title: "The watch call", paras: ["Call users.watch with topicName pointing at your Pub/Sub topic and labelIds for INBOX. Google returns expiration and historyId.", "Watches expire (~7 days). Renew on connect and via cron for active users."] },
      { id: "push-handler", title: "Push handler flow", paras: ["Pub/Sub delivers base64 data with emailAddress and historyId. Decode, map address to user, invalidate cache, notify SSE clients.", "Do not fetch full mail in the webhook — enqueue incremental sync using the new historyId."] },
      { id: "historyid-split", title: "Multiple historyId stores", paras: ["Watch setup may store historyId under one key; task extraction uses gmailHistoryId. Align keys or document which job owns which cursor.", "Split stores cause full re-fetch loops that look like sync bugs."] },
    ],
  },
  {
    slug: "microsoft-graph-webhook-validation",
    title: "Microsoft Graph Webhook Validation and Subscription Lifecycle",
    description: "validationToken handshakes, clientState checks, and why subscription renewal cannot be an afterthought.",
    tags: ["microsoft-outlook", "webhooks", "graph-api", "engineering"],
    readTime: "5 min",
    sections: [
      { id: "validation", title: "The validation handshake", paras: ["Graph sends validationToken as query param on subscription create. Respond 200 text/plain with the token echoed exactly.", "JSON responses fail validation and subscriptions never activate."] },
      { id: "clientstate", title: "clientState verification", paras: ["Set clientState when creating subscriptions. Reject notifications that do not match your secret prefix.", "Prevents stray deliveries from old environments hitting prod handlers."] },
      { id: "renewal", title: "Renewal debt", paras: ["Mail subscriptions often expire in hours unless renewed. Store subscriptionId mapped to userId in DB — TODO in many codebases for a reason.", "Without renewal, webhooks stop silently; polling or delta catch-up becomes the real sync mechanism."] },
    ],
  },
  {
    slug: "classifying-calendar-events-automatically",
    title: "Classifying Calendar Events: Meetings, Focus, Tasks, Personal",
    description: "Heuristics for tagging imported Google and Microsoft events so downstream scheduling knows what can move.",
    tags: ["calendar", "engineering", "productivity", "google-calendar", "microsoft-outlook"],
    readTime: "6 min",
    sections: [
      { id: "why", title: "Why classification matters", paras: ["A unified calendar is not just display. Rescheduling, analytics, and focus protection need to know whether a block is a client meeting or a self-owned focus session.", "Import everything as MEETING and your optimiser will never touch the right blocks."] },
      { id: "rules", title: "Rules that work in practice", paras: ["External attendees → MEETING. Title contains focus/deep work → FOCUS_TIME. Task/todo keywords → TASK. Else PERSONAL.", "Organiser-only blocks with no guests often land as PERSONAL — good candidates for auto-move."] },
      { id: "limits", title: "Limits of keywords", paras: ["'Review' in a title might be a performance review (immovable) or a code review block (movable). Keywords bootstrap; user overrides and isManaged flags refine.", "Store classification on sync; let users recategorise without fighting the next pull."] },
    ],
  },
  {
    slug: "which-calendar-events-can-be-moved",
    title: "Which Calendar Events Can Be Rescheduled Automatically",
    description: "isEventManageable logic: protecting meetings with external guests while allowing focus blocks and solo holds to shift.",
    tags: ["calendar", "scheduling", "engineering", "productivity"],
    readTime: "5 min",
    sections: [
      { id: "hard-rules", title: "Hard rules", paras: ["Meetings with any attendee email ≠ user cannot auto-move. External guests imply coordination cost no algorithm should hide.", "All-day events and immovable provider flags need explicit UI before drag-and-drop reschedule."] },
      { id: "soft-blocks", title: "Soft blocks", paras: ["FOCUS_TIME and TASK types default to manageable. Solo PERSONAL events with zero or self-only attendees qualify.", "Expose isManaged on create so users opt in: 'Allow Kvika to reschedule this event'."] },
      { id: "push-back", title: "Push changes back", paras: ["Local reschedule sets modifiedLocally and syncStatus PENDING. Push job writes to Google or Microsoft. Pull must not overwrite until push completes or conflict is detected.", "Without the flag, external sync clobbers local moves."] },
    ],
  },
  {
    slug: "detecting-calendar-sync-conflicts",
    title: "Detecting Calendar Sync Conflicts Before You Overwrite User Edits",
    description: "When modifiedLocally meets an external change to the same event — mark CONFLICT instead of silently picking a winner.",
    tags: ["calendar", "sync", "engineering", "conflict-resolution"],
    readTime: "6 min",
    sections: [
      { id: "scenario", title: "The scenario", paras: ["User drags focus block later in your app. Google Calendar still has the old slot until push runs. Pull sync sees time mismatch on an event flagged modifiedLocally.", "Blind overwrite discards user intent. Blind ignore leaves external truth stale."] },
      { id: "detection", title: "Detection", paras: ["Compare start/end from provider against local row when modifiedLocally is true. External time change → SyncStatus.CONFLICT with human-readable syncError.", "Do not auto-merge times; surface UI for pick local vs external."] },
      { id: "future", title: "What full reconciliation needs", paras: ["Version vectors or updated timestamps from both sides. Many integrations stop at detection — still better than silent loss.", "Reconciliation jobs for CONFLICT rows are the next maturity step."] },
    ],
  },
  {
    slug: "scoped-delete-reconciliation-in-calendar-sync",
    title: "Scoped Delete Reconciliation: Do Not Wipe Events Outside the Sync Window",
    description: "cleanupDeletedEvents must only delete DB rows inside the fetched date range — or a partial API response deletes your entire history.",
    tags: ["calendar", "sync", "engineering", "reliability"],
    readTime: "6 min",
    sections: [
      { id: "bug", title: "The scary bug", paras: ["Sync fetches this week only. Reconciliation deletes any DB event whose sourceId is missing from the response.", "Events next month vanish because they were not in this week's fetch. Users lose data; you lose trust."] },
      { id: "fix", title: "The fix", paras: ["Scope delete candidates to startTime >= windowStart AND endTime <= windowEnd. Never delete modifiedLocally rows without explicit user action.", "Log titles of deleted rows — first five — for support debugging."] },
      { id: "removed-flag", title: "Microsoft @removed", paras: ["Delta sync sends explicit removals. Windowed full fetch does not. Match delete strategy to fetch mode.", "Incremental delta: honour @removed globally. Window list: scoped reconciliation only."] },
    ],
    callout: { type: "tip", text: "The blog post on calendar sync tokens describes 410 Gone fallbacks — pair that with scoped deletes on full re-sync." },
    related: "/blog/syncing-google-and-microsoft-calendars-programmatically",
  },
  {
    slug: "incremental-sync-tokens-that-expire",
    title: "Incremental Sync Tokens That Expire (and the 410 Gone Fallback)",
    description: "Google syncToken and Outlook deltaLink both go stale. Design full re-sync paths before users return from holiday.",
    tags: ["calendar", "sync", "google-calendar", "microsoft-outlook", "engineering"],
    readTime: "5 min",
    sections: [
      { id: "google-410", title: "Google 410 Gone", paras: ["Long gaps invalidate syncToken. Catch 410, clear stored token, run bounded full list, persist nextSyncToken.", "Without fallback calendars freeze at last successful sync."] },
      { id: "outlook-delta", title: "Outlook invalid delta", paras: ["Graph returns errors when deltaLink is too old or mailbox structure changed. Clear outlookMailDeltaLink and restart delta from filtered initial query.", "Same user experience: brief full sync, then incremental again."] },
      { id: "ux", title: "User-visible progress", paras: ["Show 'catching up' during full re-sync. Silent multi-minute loads feel broken.", "Rate-limit parallel calendar full syncs on login to protect Graph quotas."] },
    ],
    related: "/blog/syncing-google-and-microsoft-calendars-programmatically",
  },
  {
    slug: "normalising-google-and-microsoft-event-shapes",
    title: "Normalising Google and Microsoft Events Into One Shape",
    description: "summary vs subject, htmlLink vs webLink, all-day date vs dateTime — the mapping layer every dual-calendar product needs.",
    tags: ["calendar", "engineering", "google-calendar", "microsoft-outlook"],
    readTime: "6 min",
    sections: [
      { id: "fields", title: "Field mapping", paras: ["Internal model: title, startTime, endTime, isAllDay, location, attendees[], source, sourceId, sourceCalendarId.", "Google summary → title. Microsoft subject → title. Preserve provider link for 'open in Outlook'."] },
      { id: "allday", title: "All-day edge cases", paras: ["Google all-day uses date not dateTime. Microsoft may still send midnight UTC boundaries.", "Store isAllDay explicitly; render with local midnight rules, not raw UTC strings."] },
      { id: "idempotency", title: "Idempotent upserts", paras: ["Unique on (userId, source, sourceId). Retries and overlapping jobs upsert safely.", "Duplicates show as ghost meetings — users blame the product, not the API."] },
    ],
  },
  {
    slug: "resolving-email-recipients-by-name",
    title: "Resolving Email Recipients by Name (Not Address)",
    description: "Users say 'email Kinshuok' — tiered lookup across Teams, calendar history, and org directory with fuzzy scoring.",
    tags: ["email", "microsoft-teams", "engineering", "ux"],
    readTime: "7 min",
    sections: [
      { id: "problem", title: "The UX problem", paras: ["Forcing address entry on compose breaks voice-style agent flows. Names are how humans refer to colleagues.", "Resolution must happen server-side with the user's OAuth context — never guess in the model alone."] },
      { id: "tiers", title: "Three tiers", paras: ["Teams members from joinedTeams (cap teams scanned). Calendar contacts mined from last 400 events' attendees — no extra scopes.", "Live org search via Graph $search on displayName, falling back to startswith when search is denied."] },
      { id: "scoring", title: "Fuzzy scoring", paras: ["Exact token match scores 90. Prefix 70. Substring 50. Threshold 50 accepts; below returns matched: false for UI correction.", "Email local-part match can false-positive on short queries — prefer displayName when scores tie."] },
      { id: "agent", title: "Agent contract", paras: ["Prompt the agent to pass raw names; backend resolves. OpenAPI must not require format: email on to fields or validation rejects valid flows.", "Compose and meeting prep share resolveAttendees — one directory, two surfaces."] },
    ],
  },
  {
    slug: "contact-directory-from-past-meetings",
    title: "Building a Contact Directory From Past Meetings",
    description: "When Teams directory access fails, mine attendee lists from synced calendar events — zero new Graph scopes required.",
    tags: ["calendar", "microsoft-teams", "engineering", "privacy"],
    readTime: "5 min",
    sections: [
      { id: "constraint", title: "The scope constraint", paras: ["User.ReadBasic.All and directory search require admin consent in many tenants. Calendar read often already exists.", "Past meeting attendees are people the user already met — high precision for scheduling and compose."] },
      { id: "implementation", title: "Implementation", paras: ["Query last 400 calendar events. Extract attendees JSON arrays. Dedupe by email lowercase. Keep displayName from first sighting.", "Merge with Teams directory results; higher score wins on conflict."] },
      { id: "privacy", title: "Privacy", paras: ["Directory is per-user, built from their synced data — not a global tenant export.", "Still respect unmatched names: show picker, never auto-send to wrong address on low scores."] },
    ],
  },
  {
    slug: "fuzzy-name-matching-for-attendees",
    title: "Fuzzy Name Matching for Attendee Lookup",
    description: "Why exact string match fails for first names, typos, and email local-parts — a simple scoring model that works.",
    tags: ["engineering", "search", "microsoft-teams", "ux"],
    readTime: "5 min",
    sections: [
      { id: "failures", title: "Exact match failures", paras: ["'Sarah' vs 'Sarah Chen'. 'john' vs john.doe@company.com. Case and token boundaries break naive includes().", "Typeahead needs ranked results, not first match."] },
      { id: "model", title: "Scoring model", paras: ["Normalise lowercase trim. Split displayName on whitespace for token tests.", "100 exact full string, 90 token equals query, 70 token prefix, 50 substring. Email local-part 95 on equality."] },
      { id: "threshold", title: "When to refuse", paras: ["Common first names at score 50 can wrong-match. Pair low confidence with UI disambiguation.", "searchPeople merges team + calendar + org, sorts by score, returns top 8."] },
    ],
  },
  {
    slug: "cross-org-free-busy-scheduling",
    title: "Cross-Org Free/Busy Without Calendar Admin Access",
    description: "Finding mutual slots when each attendee owns their own Microsoft token — findMeetingTimes, fallbacks, and minimumAttendeePercentage.",
    tags: ["scheduling", "microsoft-outlook", "engineering", "teams"],
    readTime: "7 min",
    sections: [
      { id: "tokens", title: "One token per attendee", paras: ["You cannot read everyone's calendar with the organiser's token alone in mixed org setups.", "Look up Integration by attendee email; each connected member contributes their Graph client."] },
      { id: "findMeetingTimes", title: "findMeetingTimes", paras: ["POST /me/findMeetingTimes with attendees[], timeConstraint, meetingDuration PT30M, minimumAttendeePercentage 100.", "returnSuggestionReasons helps debug emptySuggestionsReason in logs."] },
      { id: "fallback", title: "Manual fallback", paras: ["When API returns zero suggestions, fetch calendarView per attendee, iterate business hours, test overlap on busy/tentative/oof.", "Expensive but saves the feature when Graph heuristics disagree with reality."] },
      { id: "timezone", title: "Timezone honesty", paras: ["Pass explicit timeZone on constraint slots. '3 PM' without zone still causes pain — UI must confirm offset.", "Manual fallback appending Z to dateTime is fragile; prefer organiser IANA zone where possible."] },
    ],
    related: "/blog/scheduling-across-google-and-microsoft-teams",
  },
  {
    slug: "when-findmeetingtimes-returns-nothing",
    title: "When findMeetingTimes Returns Nothing Useful",
    description: "emptySuggestionsReason, attendee token gaps, and the manual calendar scan fallback — debugging Graph scheduling in production.",
    tags: ["microsoft-outlook", "scheduling", "engineering", "debugging"],
    readTime: "5 min",
    sections: [
      { id: "reasons", title: "Common reasons", paras: ["Attendee without connected integration — excluded silently if you only query connected users.", "Time window too narrow, duration longer than free gaps, or activityDomain work excluding evenings users wanted."] },
      { id: "debug", title: "Debug checklist", paras: ["Log requestBody and emptySuggestionsReason. Verify each attendee email resolves to a token.", "Try widening daysAhead and lowering maxCandidates constraints temporarily to isolate data vs config bugs."] },
      { id: "fallback", title: "Fallback value", paras: ["Manual intersection of calendarView events respects showAs. Skip weekends in slot iterator.", "Label results source: graph vs manual so support knows which path fired."] },
    ],
  },
  {
    slug: "wall-clock-meeting-times-from-llm-output",
    title: "Wall-Clock Meeting Times From LLM Output (Without Timezone Bugs)",
    description: "When the model returns 2025-06-09T14:00 without Z, calling toISOString() shifts the meeting. Keep local wall-clock strings instead.",
    tags: ["ai", "scheduling", "engineering", "timezones"],
    readTime: "6 min",
    sections: [
      { id: "bug", title: "The bug", paras: ["User says 'schedule 2pm tomorrow'. Model outputs ISO-like string without offset. new Date().toISOString() converts via server UTC — wrong wall clock in UI.", "Meeting invites show 9am instead of 2pm; trust dies."] },
      { id: "fix", title: "Local datetime path", paras: ["Regex LOCAL_DATE_TIME for YYYY-MM-DDTHH:mm without trailing Z or offset. Treat as opaque local wall clock.", "addMinutesToLocalDateTime uses UTC arithmetic on components without shifting zone — display matches user intent."] },
      { id: "mixed", title: "Mixed inputs", paras: ["Strings with Z go through Date parsing. Strings without go local path. Document in agent prompts: prefer explicit offsets when known.", "Fallback unparseable to now+1h rounded — log when fallback fires; it hides model errors."] },
      { id: "attendees", title: "Sanitise attendee strings", paras: ["Models emit '[name]' or quoted strings. Strip brackets and quotes before resolveAttendees.", "Comma-separated single string should split to array in Lambda normalisation too."] },
    ],
  },
  {
    slug: "extracting-tasks-from-teams-messages",
    title: "Extracting Tasks From Microsoft Teams Messages",
    description: "Pipeline: lookback window, HTML strip, batch LLM, dedupe by sourceId — turning chat noise into tracked work.",
    tags: ["microsoft-teams", "ai", "tasks", "engineering"],
    readTime: "6 min",
    sections: [
      { id: "pipeline", title: "Pipeline stages", paras: ["Fetch messages (cap 40, 14-day lookback). prepareTeamsMessage strips HTML; skip empty/too_short.", "Batch to LLM (TEAMS_BATCH_SIZE). Persist tasks with source TEAMS and sourceId for idempotency."] },
      { id: "hygiene", title: "Hygiene vs classification", paras: ["Do not regex-classify 'LGTM' vs 'action item' in code. Let LLM classify; code only drops empty bodies.", "Over-filtering in code removes context the model needs."] },
      { id: "dedupe", title: "Dedupe", paras: ["findFirst on userId + source + sourceId before create. Re-runs after failed jobs skip duplicates.", "Stats: messagesScanned, skippedReasons, llmBatches — expose in API for UI transparency."] },
    ],
  },
  {
    slug: "batch-llm-extraction-for-email",
    title: "Batch LLM Extraction for Email Tasks",
    description: "Why one API call for twenty emails beats twenty sequential calls — latency, cost, and context for cross-thread patterns.",
    tags: ["ai", "email", "engineering", "gemini"],
    readTime: "5 min",
    sections: [
      { id: "batch", title: "Batch size", paras: ["Chunk emails into batches of 20. Single extractTasksFromEmailsBatch call per chunk.", "Sequential per-email calls multiply cold start and rate limits."] },
      { id: "context", title: "Structured output", paras: ["Return emailId, tasks[], confidence per message. Reject batches that throw before cursor persist.", "Log batch index / total for long runs — support can correlate timeouts."] },
      { id: "consent", title: "Consent and rate limits", paras: ["requireAIConsent before any mail content leaves your VPC. checkRateLimit per user on extract endpoints.", "6/minute typical — enough for manual trigger, blocks abuse."] },
    ],
    related: "/blog/stop-losing-action-items-in-your-inbox",
  },
  {
    slug: "deduping-ai-extracted-tasks",
    title: "Deduping AI-Extracted Tasks Without Losing Legitimate Overlap",
    description: "Composite key on sourceId + title for EMAIL_AI — handling retries after cursor deferral and duplicate suggestions.",
    tags: ["ai", "tasks", "email", "engineering", "reliability"],
    readTime: "5 min",
    sections: [
      { id: "key", title: "Dedupe key", paras: ["Same email can suggest 'Review PR' twice if LLM re-runs — match userId, source EMAIL_AI, sourceId emailId, title.", "Two different tasks from one email need different titles — model prompt should separate them."] },
      { id: "retry", title: "Retries", paras: ["Deferred sync cursors mean re-processing overlap. Dedupe makes at-least-once safe.", "Log skippedDuplicates count in API response for UI toast."] },
      { id: "teams", title: "Teams source", paras: ["TEAMS dedupe on sourceId only — one message maps to multiple tasks with distinct sourceId suffixes in draft.", "Align id generation in normalise layer."] },
    ],
  },
  {
    slug: "ai-consent-before-processing-mail",
    title: "AI Consent Before Processing Mail and Calendar Data",
    description: "Explicit opt-in for features that send user content to models — gating extract, agent, and compose endpoints consistently.",
    tags: ["ai", "privacy", "security", "compliance"],
    readTime: "5 min",
    sections: [
      { id: "why", title: "Why explicit consent", paras: ["OAuth for mail read ≠ consent for third-party LLM processing. Regulators and enterprise buyers ask.", "Settings toggle with timestamp; API returns AI_CONSENT_REQUIRED until granted."] },
      { id: "surface", title: "Consistent gating", paras: ["Agent route, extract-from-emails, chat — all call requireAIConsent(session.email) early.", "Mixed gating confuses security review: 'sometimes data leaves, sometimes not'."] },
      { id: "revoke", title: "Revocation", paras: ["Disabling consent stops new LLM calls; does not delete prior tasks. Document retention separately.", "Clear copy: what leaves, which provider, retention period."] },
    ],
  },
  {
    slug: "rate-limiting-expensive-ai-endpoints",
    title: "Rate Limiting Expensive AI Endpoints",
    description: "Redis-backed sliding windows for agent, extract, and chat — protecting cost and upstream quotas per user.",
    tags: ["ai", "engineering", "redis", "security"],
    readTime: "5 min",
    sections: [
      { id: "keys", title: "Per-user keys", paras: ["ai:agent:{email} 20/min. ai:extract-emails 6/min. Separate buckets so one heavy extract does not block chat.", "Return retryAfterSeconds in 429 JSON for client backoff."] },
      { id: "implementation", title: "Implementation sketch", paras: ["INCR with TTL window or sliding log in Redis. Fail open vs closed is a product choice — fail closed for cost control.", "Log rate limit hits to spot abuse or UX friction (limit too tight)."] },
    ],
  },
  {
    slug: "redis-caching-for-mail-and-tasks",
    title: "Redis Caching for Mail and Tasks",
    description: "Cache keys scoped by user and day, pattern invalidation on webhook, and when del beats update.",
    tags: ["redis", "engineering", "email", "performance"],
    readTime: "5 min",
    sections: [
      { id: "keys", title: "Key design", paras: ["emails:{userId}:{date} for list cache. tasks:{userId} for task board.", "Include provider in key if partial cache per stack."] },
      { id: "invalidate", title: "Invalidation", paras: ["Gmail sync deletes cache key on any change set. Outlook webhook deleteCachePattern emails:{userId}:*.", "Over-invalidation is safer than stale mail after read/unread toggle."] },
      { id: "miss", title: "Cache miss path", paras: ["Miss falls through to provider fetch. Always refresh cursors on origin, not from cache metadata.", "TTL backup if webhooks drop — 5–15 min for mail lists acceptable with incremental merge."] },
    ],
  },
  {
    slug: "ai-agents-calling-your-own-api",
    title: "AI Agents Calling Your Own API: Lambda to Next.js Internal Routes",
    description: "Bedrock action groups invoke Lambdas that POST to internal compose/meeting routes with shared-secret auth and userEmail propagation.",
    tags: ["ai", "aws", "engineering", "architecture"],
    readTime: "7 min",
    sections: [
      { id: "bridge", title: "The bridge pattern", paras: ["Agent runtime cannot run inside your Next.js VPC. Lambdas call CHRONOFLOW_INTERNAL_BASE_URL with x-chronoflow-agent-secret.", "Body includes userEmail from sessionAttributes — same code paths as UI, no duplicate business logic."] },
      { id: "auth", title: "Shared secret auth", paras: ["INTERNAL_AGENT_SECRET must match Lambda env and web verifyInternalAgentRequest. Rotate together.", "Mismatch = 401 on every tool — silent in agent trace until you read logs."] },
      { id: "extract", title: "extractInput variance", paras: ["Bedrock sends OpenAPI property arrays or JSON body. Normalise both before Zod validation.", "Reply flow reads emailId from promptSessionAttributes when agent omits params."] },
      { id: "deploy", title: "Agent version pinning", paras: ["Hash instructions/schema into alias description to force new published version on deploy.", "Without it alias stays on first version — prompt fixes never reach prod."] },
    ],
  },
  {
    slug: "mapping-agent-tools-to-ui-cards",
    title: "Mapping Agent Tool Results to UI Cards",
    description: "Registry pattern: tool payload action strings become typed clientActions — email draft, meeting scheduler, Jira ticket.",
    tags: ["ai", "frontend", "engineering", "ux"],
    readTime: "6 min",
    sections: [
      { id: "registry", title: "Registry", paras: ["agent-tool-mappers maps show_new_email_draft, show_meeting_scheduler, etc. to {type, props} + user message.", "Adding a tool = Lambda response shape + mapper + drawer component — comment at top of file lists all four."] },
      { id: "trace", title: "Trace vs text", paras: ["Prefer extractToolResultsFromTrace over parsing assistant JSON. Model instructed not to echo tool JSON.", "Legacy extractAgentClientAction still parses fenced JSON for older sessions."] },
      { id: "multi", title: "Multiple cards per turn", paras: ["Return clientActions[] and clientActionMessages[]. Drawer renders N cards — one message each.", "Single clientAction field kept for backwards compatibility."] },
    ],
  },
  {
    slug: "handling-multi-step-agent-requests",
    title: "Handling Multi-Step Agent Requests in One Turn",
    description: "'Email Alex and schedule a meeting' — prompt instructions, trace extraction arrays, and avoiding duplicate cards.",
    tags: ["ai", "engineering", "productivity"],
    readTime: "6 min",
    sections: [
      { id: "prompt", title: "Prompt contract", paras: ["MULTI-TOOL: invoke every applicable tool in same turn. Runtime prompt repeats with name-resolution hint.", "Stopping after first tool is model laziness — reinforce in system and alias instructions."] },
      { id: "route", title: "API response shape", paras: ["When clientActions.length > 0, skip text-only fallback. Include messages joined or per-index.", "UI handleAgentClientActions loops types — compose then schedule in one assistant bubble group."] },
      { id: "dedupe", title: "Trace dedupe", paras: ["Same tool output may appear in multiple trace nodes. Fingerprint by action + salient fields before push to array.", "Without dedupe users see twin drafts — looks like bugs, not thoroughness."] },
    ],
  },
  {
    slug: "compose-email-drafts-from-natural-language",
    title: "Compose Email Drafts From Natural Language Context",
    description: "resolveRecipient, tone maps, and LLM body generation — separating address resolution from prose generation.",
    tags: ["ai", "email", "engineering", "ux"],
    readTime: "5 min",
    sections: [
      { id: "split", title: "Split responsibilities", paras: ["Backend resolves name → email before prompt. Model writes body with greetingName — not To: headers in body.", "MISSING recipient returns structured code for person picker UI."] },
      { id: "tone", title: "Tone control", paras: ["professional | casual | friendly | formal maps to prompt adjectives — not separate models.", "Subject optional; model can infer from context when blank."] },
      { id: "review", title: "Human review", paras: ["Always show draft card before send. Agent never sends autonomously in v1.", "PersonRecipientInput typeahead for correction when matched: false."] },
    ],
  },
  {
    slug: "analytics-without-new-database-tables",
    title: "Product Analytics Without New Database Tables",
    description: "Aggregating focus hours, meeting load, and task sources from existing CalendarEvent, Task, and Integration rows.",
    tags: ["analytics", "engineering", "productivity", "sql"],
    readTime: "6 min",
    sections: [
      { id: "approach", title: "Ship without schema migrations", paras: ["KPIs from queries over events and tasks in range — sumEventHours clips to window boundaries.", "Week vs month toggles date-fns intervals; compare to prior period for delta strings."] },
      { id: "insights", title: "Rule-based insights", paras: ["Heuristics: stale open tasks, meeting-heavy days, low focus — generated in code not ML.", "Keeps dashboard explainable; users trust '12 open >14 days' more than black-box scores."] },
      { id: "integrations", title: "Integration health", paras: ["Surface lastSyncedAt and sync errors from Integration + CalendarSync.", "Empty analytics with broken OAuth is a reconnect prompt, not zero activity."] },
    ],
  },
  {
    slug: "email-push-vs-poll-tradeoffs",
    title: "Email Push vs Poll: Tradeoffs for Unified Inboxes",
    description: "30-second polling, SSE nudges, and provider webhooks — layering reliability without API hammering.",
    tags: ["email", "engineering", "real-time", "architecture"],
    readTime: "5 min",
    sections: [
      { id: "poll", title: "Polling baseline", paras: ["Simple, works everywhere, wastes quota when idle. Good backstop when webhooks drop.", "Use incremental cursors on poll — not full fetch."] },
      { id: "push", title: "Push benefits", paras: ["Near-real-time unread badges. Lower average API volume for active mailboxes.", "Ops cost: renewal, validation, multi-instance fanout."] },
      { id: "layer", title: "Layered design", paras: ["Webhook → invalidate cache → SSE nudge → client incremental merge.", "forceRefresh on every SSE event negates cursor savings — debounce."] },
    ],
  },
  {
    slug: "all-day-events-across-providers",
    title: "All-Day Events Across Google and Microsoft",
    description: "date vs dateTime fields, timezone-less all-day blocks, and rendering without off-by-one day shifts.",
    tags: ["calendar", "timezones", "engineering", "google-calendar"],
    readTime: "5 min",
    sections: [
      { id: "representations", title: "Provider representations", paras: ["Google all-day: start.date '2025-06-15'. Timed: start.dateTime with timeZone.", "Microsoft may emit midnight boundaries — detect with !event.start.dateTime pattern."] },
      { id: "storage", title: "Storage", paras: ["isAllDay flag on normalised row. UI edit dialog may block reschedule for all-day until supported.", "Do not run duration math on all-day using hour deltas."] },
    ],
  },
  {
    slug: "time-zones-in-calendar-apis",
    title: "Time Zones in Calendar APIs: Practical Rules",
    description: "Store UTC, display local, request UTC from Graph with Prefer header — rules that prevent 6am meeting disasters.",
    tags: ["calendar", "timezones", "engineering", "microsoft-outlook"],
    readTime: "6 min",
    sections: [
      { id: "store", title: "Store and display", paras: ["Database timestamps in UTC. UI renders with user IANA zone from profile or browser.", "Never show raw API strings without knowing if offset included."] },
      { id: "graph", title: "Graph Prefer header", paras: ["Prefer: outlook.timezone=\"UTC\" on calendarView reduces ambiguous offsets in multi-mailbox sync.", "Still confirm with users on scheduling confirm step."] },
      { id: "llm", title: "LLM scheduling", paras: ["Separate wall-clock local path for model output without Z — see dedicated post.", "Agent runtime prompt can include user timeZone and currentTime for grounding."] },
    ],
  },
  {
    slug: "composite-keys-for-idempotent-sync",
    title: "Composite Keys for Idempotent Calendar and Mail Sync",
    description: "userId + source + sourceId uniqueness — surviving overlapping cron, webhooks, and manual refresh.",
    tags: ["sync", "database", "engineering", "reliability"],
    readTime: "5 min",
    sections: [
      { id: "why", title: "Why idempotency", paras: ["At-least-once delivery is default for webhooks and client retries.", "Without unique constraints duplicates appear as ghost meetings or twin tasks."] },
      { id: "keys", title: "Key choice", paras: ["Calendar: (userId, source GOOGLE|MICROSOFT, sourceId provider event id).", "Tasks: sourceId = email id or message id + optional disambiguator for multi-task messages."] },
      { id: "upsert", title: "Upsert pattern", paras: ["find unique → update or create. On conflict update changed fields only when !modifiedLocally.", "Logs: created vs updated vs unchanged counts per sync job."] },
    ],
  },
  {
    slug: "the-modifiedlocally-flag-pattern",
    title: "The modifiedLocally Flag Pattern for Bidirectional Sync",
    description: "Mark local edits before push completes so pull sync does not clobber user drags on the calendar grid.",
    tags: ["sync", "calendar", "engineering", "ux"],
    readTime: "5 min",
    sections: [
      { id: "flow", title: "Edit flow", paras: ["PATCH event → modifiedLocally true, syncStatus PENDING. Push job writes external.", "Pull sees flag — skip blind overwrite of title/times; check conflict instead."] },
      { id: "cleanup", title: "cleanupDeletedEvents", paras: ["Never delete modifiedLocally rows during reconciliation — user may have deleted externally while editing locally.", "Explicit user delete triggers external delete TODO path."] },
    ],
  },
  {
    slug: "protecting-focus-time-on-shared-calendars",
    title: "Protecting Focus Time on Shared Calendars",
    description: "Classification, isManaged, and why external-attendee meetings stay immovable — product rules for automatic reschedule.",
    tags: ["productivity", "calendar", "focus", "scheduling"],
    readTime: "6 min",
    sections: [
      { id: "product", title: "Product intent", paras: ["Focus blocks exist to defend deep work. Auto-move only blocks the user owns end-to-end.", "Client meetings stay fixed — moving them without consent destroys trust."] },
      { id: "signals", title: "Signals", paras: ["FOCUS_TIME type + no external guests + isManaged true = movable.", "Keyword classification bootstraps; users rename 'Focus' to custom titles over time — allow manual type override."] },
      { id: "algorithm", title: "Rescheduler", paras: ["Example algorithm finds gaps, PATCHes manageable events, sets modifiedLocally.", "First-fit is v0; priority and deadline awareness belong in v2."] },
    ],
  },
  {
    slug: "meeting-prep-as-explicit-tasks",
    title: "Meeting Prep as Explicit Tasks (Not Implied by the Invite)",
    description: "Calendar invites hide homework — linking prep tasks to source threads and invites so nothing slips.",
    tags: ["productivity", "tasks", "meetings", "calendar"],
    readTime: "5 min",
    sections: [
      { id: "leak", title: "The prep leak", paras: ["'Design review Thursday' assumes doc read, Figma review, comment pass. None of that is in the task system.", "Same leak class as inbox action items — implicit work without owner or date."] },
      { id: "fix", title: "Explicit capture", paras: ["When scheduling, optional checklist: prep tasks with due before start. Link url to invite or doc.", "AI can suggest prep from agenda email — human confirms before create."] },
    ],
    related: "/blog/stop-losing-action-items-in-your-inbox",
  },
  {
    slug: "why-inbox-zero-fails-engineers",
    title: "Why Inbox Zero Fails Most Engineers",
    description: "Recency sorting, reference vs action mix, and capture systems that survive busy release weeks.",
    tags: ["productivity", "email", "software-engineers"],
    readTime: "6 min",
    sections: [
      { id: "myth", title: "The myth", paras: ["Inbox zero as moral virtue breaks when your job is interrupt-driven. Empty inbox ≠ empty commitments.", "Archived threads with un-captured asks are worse than visible clutter."] },
      { id: "alternative", title: "Capture alternative", paras: ["Daily scan for action verbs → task list with dates → link to source.", "Inbox becomes reference; task list becomes execution queue."] },
    ],
    related: "/blog/stop-losing-action-items-in-your-inbox",
  },
  {
    slug: "context-switching-between-gmail-and-outlook",
    title: "The Hidden Cost of Switching Between Gmail and Outlook",
    description: "Dual inbox tabs, missed threads, and why unified views need incremental sync not iframe embeds.",
    tags: ["productivity", "email", "gmail", "microsoft-outlook"],
    readTime: "5 min",
    sections: [
      { id: "cost", title: "Switching cost", paras: ["Consultants and founders on two accounts check one, forget the other. Unread counts diverge.", "Mental model splits — 'did they reply on work or client mail?'"] },
      { id: "unify", title: "What unification requires", paras: ["Normalised list + incremental cursors both sides + clear provider badge.", "Embed webmail in iframe avoids sync but kills search and task extraction — false economy."] },
    ],
  },
  {
    slug: "the-async-ask-buried-in-email",
    title: "The Async Ask Buried Mid-Paragraph",
    description: "Recognising low-friction requests that never become tickets — and why AI extraction helps on busy weeks.",
    tags: ["productivity", "email", "tasks", "communication"],
    readTime: "5 min",
    sections: [
      { id: "pattern", title: "The pattern", paras: ["'When you get a chance' reads optional until someone pings two weeks later.", "Highest leak rate because guilt replaces tracking."] },
      { id: "capture", title: "Capture habits", paras: ["Highlight + task in one motion. AI batch suggest on daily trigger.", "Team norm: explicit ticket or explicit no — middle ground fills inbox guilt only."] },
    ],
  },
  {
    slug: "scheduling-buffers-between-meetings",
    title: "Scheduling Buffers Between Meetings",
    description: "Back-to-back video calls leave no transition time — calendar tools should treat buffers as first-class blocks.",
    tags: ["scheduling", "calendar", "productivity", "remote-work"],
    readTime: "5 min",
    sections: [
      { id: "problem", title: "The problem", paras: ["Optimisers maximise utilisation; humans need bio and context switch time.", "Free slot at 2pm ignores 1:55pm hard stop from overrun."] },
      { id: "practice", title: "Practices", paras: ["15-min after external meetings. Focus blocks before deep work, not after lunch only.", "Team policy beats individual heroics — shared quiet hours help."] },
    ],
  },
  {
    slug: "recurring-meetings-that-should-have-ended",
    title: "Recurring Meetings That Should Have Ended Months Ago",
    description: "Stale recurrences clog calendars silently — quarterly audit checklist for eng teams.",
    tags: ["meetings", "productivity", "calendar", "team-culture"],
    readTime: "5 min",
    sections: [
      { id: "drift", title: "Recurrence drift", paras: ["Project ended; standup remains. Attendance drops to two people multitasking.", "Calendar weight distorts analytics — looks busy, feels empty."] },
      { id: "audit", title: "Audit ritual", paras: ["Quarterly: list recurrences >8 weeks, ask owner continue/shrink/kill.", "Require agenda owner rotation or auto-expire."] },
    ],
  },
  {
    slug: "free-busy-vs-full-calendar-sharing",
    title: "Free/Busy vs Full Calendar Sharing",
    description: "Privacy-preserving scheduling uses availability bits, not full title export — especially cross-org.",
    tags: ["scheduling", "privacy", "calendar", "microsoft-outlook"],
    readTime: "5 min",
    sections: [
      { id: "privacy", title: "Privacy", paras: ["Teammates need slots, not 'Therapy' or 'Interview prep' titles.", "Free/busy API returns blocks without subject when permissions tight."] },
      { id: "product", title: "Product implication", paras: ["Scheduling UI shows green/red grid, not full event list for peers unless shared.", "Organiser sees own titles; attendees see intersection only."] },
    ],
  },
  {
    slug: "choosing-oauth-scopes-carefully",
    title: "Choosing OAuth Scopes Carefully for Calendar and Mail Products",
    description: "Minimum viable permissions, offline_access, and why admin-consent scopes kill SMB adoption.",
    tags: ["oauth", "security", "engineering", "google"],
    readTime: "6 min",
    sections: [
      { id: "minimum", title: "Minimum viable", paras: ["Calendar read for sync; Mail.Read for inbox; write scopes only when sending/creating.", "Each extra scope drops conversion on consent screen."] },
      { id: "offline", title: "offline_access", paras: ["Without refresh tokens Microsoft sessions die in ~1 hour.", "Google access_type offline on first connect — re-auth if refresh missing."] },
      { id: "admin", title: "Admin consent scopes", paras: ["Directory search may need admin approval — degrade to calendar-mined contacts gracefully.", "Document which features need which scope tier."] },
    ],
  },
  {
    slug: "handling-microsoft-invalid-grant",
    title: "Handling Microsoft invalid_grant and Silent Integration Breakage",
    description: "Refresh failures after password change, conditional access, or revoked sessions — UX that saves support hours.",
    tags: ["microsoft-outlook", "oauth", "support", "engineering"],
    readTime: "5 min",
    sections: [
      { id: "symptoms", title: "Symptoms", paras: ["Mail empty, calendar frozen, no hard error in UI if you swallow 401.", "Logs show refresh 400 invalid_grant."] },
      { id: "fix", title: "Fix UX", paras: ["needsReauth banner on integration card. One-click reconnect preserving userId.", "Email user when background job hits invalid_grant — do not wait for login."] },
    ],
  },
  {
    slug: "double-booking-across-two-calendars",
    title: "Double Booking Across Two Calendars",
    description: "Google personal + Outlook work on one grid — detecting overlaps before they become awkward Zoom exits.",
    tags: ["calendar", "productivity", "google-calendar", "microsoft-outlook"],
    readTime: "5 min",
    sections: [
      { id: "cause", title: "Why it happens", paras: ["Each provider only knows its own bookings. Accept on Google while Outlook shows free.", "Unified view must merge before offering slots to others."] },
      { id: "fix", title: "Mitigation", paras: ["Single grid all sources. Conflict highlight when events overlap in time.", "Scheduling assistant reads combined busy, not one provider."] },
    ],
  },
  {
    slug: "task-capture-from-slack-email-teams",
    title: "Task Capture From Slack, Email, and Teams",
    description: "Different channels, same execution queue — source attribution and link-back patterns.",
    tags: ["tasks", "productivity", "microsoft-teams", "email"],
    readTime: "6 min",
    sections: [
      { id: "sources", title: "Sources", paras: ["EMAIL_AI, TEAMS, MANUAL, JIRA, GITHUB — task.source drives filters and analytics colours.", "Each creation path stores url + sourceData blob for context."] },
      { id: "unify", title: "One queue", paras: ["Engineers should not check three apps for today's work.", "Extraction proposes; unified list executes."] },
    ],
  },
  {
    slug: "prioritisation-when-everything-is-urgent",
    title: "Prioritisation When Everything Is Urgent",
    description: "Priority fields in extracted tasks — making AI suggestions editable before they land in the backlog.",
    tags: ["tasks", "productivity", "ai", "software-engineers"],
    readTime: "5 min",
    sections: [
      { id: "noise", title: "Urgency inflation", paras: ["Everything marked high → nothing is. Model over-weights 'ASAP' in subject lines.", "Default medium; user promotes."] },
      { id: "review", title: "Review gate", paras: ["Batch extract UI shows suggestions before bulk create — or create with easy bulk edit.", "Due dates optional but powerful when present."] },
    ],
  },
  {
    slug: "deep-work-blocks-that-survive-rescheduling",
    title: "Deep Work Blocks That Survive a Rescheduling Algorithm",
    description: "Movable focus time only works when meetings with guests stay pinned — design rules for automatic calendar repair.",
    tags: ["focus", "calendar", "productivity", "engineering"],
    readTime: "5 min",
    sections: [
      { id: "intent", title: "Intent", paras: ["Algorithm fills gaps by moving owned blocks, not by shrinking immovable meetings.", "isEventManageable gate is the product soul."] },
      { id: "user", title: "User trust", paras: ["Show what moved and why in activity log.", "Undo window for automatic moves in early versions."] },
    ],
  },
  {
    slug: "email-notification-batching",
    title: "Email Notification Batching for Sanity",
    description: "Webhook storms and SSE debounce — reducing refresh thrash without missing important mail.",
    tags: ["email", "productivity", "engineering", "ux"],
    readTime: "5 min",
    sections: [
      { id: "storm", title: "Notification storms", paras: ["Label sync can fire dozens of webhooks in seconds.", "Debounce client fetch 2–5s; coalesce unread badge updates."] },
      { id: "important", title: "Important senders", paras: ["Optional VIP list breaks through batch — product decision.", "Most users prefer stable UI over instant for bulk noise."] },
    ],
  },
  {
    slug: "writing-events-back-to-the-right-provider",
    title: "Writing Calendar Events Back to the Right Provider",
    description: "Create on Google when only Google connected, Teams when Microsoft — default provider logic for mixed integrations.",
    tags: ["calendar", "engineering", "google-calendar", "microsoft-outlook"],
    readTime: "5 min",
    sections: [
      { id: "default", title: "Default provider", paras: ["buildMeetingDraft: teams if Microsoft integration else google.", "Agent told not to ask which calendar — product picks from connected accounts."] },
      { id: "create", title: "Create path", paras: ["Use organiser's token for provider API. Invitees on other stack get email invite — standard ICS flow.", "Store source + sourceId on created row for future sync."] },
    ],
  },
  {
    slug: "stale-sync-after-vacation",
    title: "Stale Sync After Vacation: User Expectations and Catch-Up UX",
    description: "Returning from PTO to expired tokens and 410 sync responses — designing calm catch-up flows.",
    tags: ["calendar", "email", "sync", "ux"],
    readTime: "5 min",
    sections: [
      { id: "return", title: "Return experience", paras: ["User expects two weeks of mail and events to appear.", "Full re-sync + progress bar beats silent failure."] },
      { id: "token", title: "Token rot", paras: ["Long idle may expire refresh. Reconnect prompt on first failed job after login.", "Partial data with banner beats empty state."] },
    ],
  },
  {
    slug: "graph-api-pagination-footguns",
    title: "Microsoft Graph Pagination Footguns",
    description: "nextLink vs deltaLink, @odata.nextLink on first sync, and stopping too early.",
    tags: ["microsoft-outlook", "graph-api", "engineering", "sync"],
    readTime: "5 min",
    sections: [
      { id: "confusion", title: "Common confusion", paras: ["Developers grab first page deltaLink — missing events on page 2+.", "Loop until deltaLink present, not until value.length === 0."] },
      { id: "top", title: "$top limits", paras: ["$top=50 on busy inbox needs pagination same day.", "Log page count on initial connect for quota planning."] },
    ],
  },
  {
    slug: "gmail-label-changes-as-sync-events",
    title: "Gmail Label Changes as Sync Events",
    description: "labelAdded and labelRemoved in history API — why read/unread must incrementally update without full fetch.",
    tags: ["gmail", "email", "sync", "engineering"],
    readTime: "5 min",
    sections: [
      { id: "types", title: "History types", paras: ["history.list with messageAdded, messageDeleted, labelAdded, labelRemoved.", "Star/unread/archive all move labels — UI unread count depends on it."] },
      { id: "fetch", title: "Refetch on label change", paras: ["Add message id to changed set; messages.get format full or metadata.", "Cheaper than re-listing entire inbox."] },
    ],
  },
  {
    slug: "teams-directory-search-permissions",
    title: "Teams Directory Search When Permissions Are Limited",
    description: "joinedTeams + members works for many users; org-wide search fails closed — graceful degradation paths.",
    tags: ["microsoft-teams", "engineering", "oauth", "ux"],
    readTime: "5 min",
    sections: [
      { id: "teams", title: "Team-scoped directory", paras: ["/me/joinedTeams then /teams/{id}/members — cap teams at 5 for latency.", "Fetch /users/{id} for mail when member payload lacks email."] },
      { id: "fail", title: "When org search fails", paras: ["$search denied → startswith filter → calendar contacts → unmatched picker.", "Never block compose entirely on directory denial."] },
    ],
  },
  {
    slug: "people-read-vs-user-readbasic-all",
    title: "People.Read vs User.ReadBasic.All in Practice",
    description: "Which Graph scopes unlock which lookup tiers — and what to do when enterprise admins say no.",
    tags: ["microsoft-outlook", "oauth", "security", "engineering"],
    readTime: "5 min",
    sections: [
      { id: "scopes", title: "Scope map", paras: ["/me/people search needs People.Read. /users $search needs directory permissions.", "Calendar-mined contacts need only calendar data you already store."] },
      { id: "degrade", title: "Degrade path", paras: ["Feature matrix doc: typeahead quality per scope tier.", "In-app copy when org blocks directory: 'Connect Teams or add emails manually'."] },
    ],
  },
  {
    slug: "fallback-when-org-search-is-denied",
    title: "Fallback When Org Directory Search Is Denied",
    description: "startswith(displayName) when $search fails — and accepting imperfection in attendee resolution.",
    tags: ["microsoft-outlook", "engineering", "search", "ux"],
    readTime: "5 min",
    sections: [
      { id: "search", title: "$search vs filter", paras: ["ConsistencyLevel eventual + $search fast when allowed.", "startswith misses middle names — user confirms in picker."] },
      { id: "people", title: "/me/people", paras: ["Secondary candidate source for frequent contacts.", "Merge and score uniformly with team + calendar lists."] },
    ],
  },
  {
    slug: "typeahead-search-across-multiple-sources",
    title: "Typeahead Search Across Multiple People Sources",
    description: "searchPeople merges Teams, calendar history, and org candidates — dedupe by email, rank by score.",
    tags: ["ux", "search", "engineering", "microsoft-teams"],
    readTime: "5 min",
    sections: [
      { id: "merge", title: "Merge logic", paras: ["Promise.all three sources. Map by email lowercase; keep highest score.", "Return top 8 for dropdown — same component in meeting scheduler and compose."] },
      { id: "min", title: "Minimum query length", paras: ["q.length < 2 returns [] — avoids expensive Graph calls on single keystroke.", "Debounce 200ms in UI layer."] },
    ],
  },
  {
    slug: "task-source-attribution",
    title: "Task Source Attribution: EMAIL_AI, TEAMS, and Beyond",
    description: "Why source enums matter for analytics, filters, and trusting where work came from.",
    tags: ["tasks", "analytics", "engineering", "productivity"],
    readTime: "5 min",
    sections: [
      { id: "enum", title: "Source enum", paras: ["EMAIL_AI vs MANUAL vs TEAMS drives dashboard pie and filter chips.", "Wrong source breaks 'tasks from email this week' KPI."] },
      { id: "metadata", title: "sourceData JSON", paras: ["Store emailSubject, from, confidence, extractedAt for audit.", "Support asks 'why was this created?' — metadata answers."] },
    ],
  },
  {
    slug: "linking-tasks-back-to-source-messages",
    title: "Linking Tasks Back to Source Messages",
    description: "url field to webLink, provider in sourceData — one click from task row to originating thread.",
    tags: ["tasks", "ux", "email", "productivity"],
    readTime: "5 min",
    sections: [
      { id: "link", title: "Deep links", paras: ["Gmail htmlLink and Outlook webLink on task.url.", "Context switch cost drops — no searching inbox by subject."] },
      { id: "teams", title: "Teams messages", paras: ["Store team/channel/message ids in sourceData for future deep link when Graph supports stable URLs.", "Context string in UI: team · channel."] },
    ],
  },
  {
    slug: "security-of-server-side-oauth-tokens",
    title: "Security of Server-Side OAuth Tokens in a SaaS Inbox",
    description: "Encrypt at rest, never log access tokens, rotate refresh tokens — baseline for mail/calendar products.",
    tags: ["security", "oauth", "engineering", "compliance"],
    readTime: "6 min",
    sections: [
      { id: "store", title: "Storage", paras: ["Integration table per user per provider. Secrets in env, tokens in DB with encryption at rest.", "Export-data route lets users leave — deletion must revoke and wipe tokens."] },
      { id: "logs", title: "Logging hygiene", paras: ["Log historyId and deltaLink prefixes, not mail bodies in prod.", "Agent internal routes verify shared secret header on every call."] },
    ],
  },
  {
    slug: "building-for-mixed-google-microsoft-teams",
    title: "Building for Mixed Google and Microsoft Teams",
    description: "Product architecture when you cannot pick one stack — dual integrations as default, not edge case.",
    tags: ["product", "engineering", "google-calendar", "microsoft-outlook"],
    readTime: "6 min",
    sections: [
      { id: "default", title: "Mixed is default", paras: ["Post-acquisition, agency + client, personal + work — dual connect is normal path.", "Single-provider mode is optimisation, not assumption."] },
      { id: "test", title: "Test matrix", paras: ["QA four combos: G only, M only, both, neither. Feature flags per integration presence.", "Scheduling defaults from availableProviders object."] },
    ],
  },
  {
    slug: "calendar-colour-coding-by-source",
    title: "Calendar Colour Coding by Source",
    description: "Visual distinction for Google vs Microsoft events on unified grid — reducing 'where did this come from?' confusion.",
    tags: ["calendar", "ux", "design", "productivity"],
    readTime: "4 min",
    sections: [
      { id: "why", title: "Why colour", paras: ["Merged grid blurs ownership. Border or dot by EventSource helps debug sync and double-booking.", "Accessibility: do not rely on colour alone — label in tooltip."] },
    ],
  },
  {
    slug: "jira-tickets-from-natural-language",
    title: "Jira Tickets From Natural Language Agent Requests",
    description: "Structured draft cards before create — same human-review pattern as email compose.",
    tags: ["ai", "jira", "engineering", "productivity"],
    readTime: "5 min",
    sections: [
      { id: "draft", title: "Draft first", paras: ["show_jira_ticket_draft clientAction with title, description, project hint.", "User edits in card; submit calls create API — no silent ticket spam."] },
      { id: "agent", title: "Agent tool", paras: ["Lambda jira-actions.mjs → internal route with Zod schema.", "Same secret auth and userEmail propagation as gmail actions."] },
    ],
  },
  {
    slug: "meeting-scheduler-ui-from-structured-drafts",
    title: "Meeting Scheduler UI From Structured Drafts",
    description: "Agent returns show_meeting_scheduler JSON — pre-filled times, attendees, provider — user confirms before book.",
    tags: ["ai", "scheduling", "ux", "engineering"],
    readTime: "5 min",
    sections: [
      { id: "draft", title: "Structured draft", paras: ["buildMeetingDraft resolves attendees, normalises times, picks provider.", "UI shows PersonRecipientInput for unresolvedAttendees."] },
      { id: "confirm", title: "Confirm step", paras: ["Free/busy check on submit, not on every keystroke.", "Failure surfaces Graph errors as actionable reconnect or widen window."] },
    ],
  },
  {
    slug: "lessons-shipping-unified-productivity-tools",
    title: "Lessons From Shipping Unified Productivity Tools",
    description: "Incremental sync, explicit consent, human review on AI actions, and mixed-stack first — themes from a year of building.",
    tags: ["product", "engineering", "productivity", "retrospective"],
    readTime: "7 min",
    sections: [
      { id: "sync", title: "Sync is the product", paras: ["Calendar and mail UX is only as good as cursor discipline and conflict rules.", "Users forgive plain UI; they do not forgive missing meetings."] },
      { id: "ai", title: "AI as propose", paras: ["Extract, compose, schedule — all draft + confirm. Autonomy comes after trust metrics.", "Consent and rate limits are feature requirements, not compliance checkbox."] },
      { id: "mixed", title: "Mixed stack first", paras: ["Design for Google + Microsoft day one. Single-stack shortcuts become dead ends.", "Name resolution, dual cursors, provider-default create — all symptoms of same reality."] },
      { id: "next", title: "What is next", paras: ["Full calendar delta in production paths. Subscription renewal mapping. Conflict reconciliation UI.", "Ship incremental value; document footguns honestly in engineering posts like these."] },
    ],
    related: "/blog/syncing-google-and-microsoft-calendars-programmatically",
  },
]

const POST_DATES = dates()
if (TOPICS.length !== POST_DATES.length) {
  console.error(`Topic count ${TOPICS.length} !== date count ${POST_DATES.length}`)
  process.exit(1)
}

mkdirSync(OUT_DIR, { recursive: true })

const slugs = []

for (let i = 0; i < TOPICS.length; i++) {
  const topic = TOPICS[i]
  const date = POST_DATES[i]
  slugs.push(topic.slug)

  const sectionsJsx = topic.sections
    .map((sec) => {
      const paras = sec.paras.map((p) => `      <P>${jsxText(p)}</P>`).join("\n")
      return `      <H2 id="${sec.id}">${jsxText(sec.title)}</H2>\n${paras}`
    })
    .join("\n\n")

  const calloutJsx = topic.callout
    ? `\n      <Callout type="${topic.callout.type}">${jsxText(topic.callout.text)}</Callout>\n`
    : ""

  const relatedHref = topic.related || (i > 0 ? `/blog/${TOPICS[i - 1].slug}` : "/blog/syncing-google-and-microsoft-calendars-programmatically")
  const relatedLabel = topic.related ? "Related reading" : "Previous in series"

  const tagsJson = JSON.stringify(topic.tags)
  const sectionsJson = JSON.stringify(topic.sections.map(({ id, title }) => ({ id, title })), null, 2)
    .split("\n")
    .map((line, idx) => (idx === 0 ? line : "  " + line))
    .join("\n")

  const file = `import type { BlogPost } from "@/lib/blog"
import { H2, P, A, Callout } from "@/components/blog/prose"

const post: BlogPost = {
  slug: "${topic.slug}",
  title: ${JSON.stringify(topic.title)},
  description: ${JSON.stringify(topic.description)},
  date: "${date}",
  tags: ${tagsJson},
  author: "Kvika Team",
  readTime: "${topic.readTime}",
  sections: ${sectionsJson},
  content: () => (
    <article>
      <P>${jsxText(topic.description)}</P>
      <P>${jsxText(getLead(topic))}</P>

${sectionsJsx}
${calloutJsx}
      <P className="mt-10 border-t border-[var(--cf-border)] pt-8 text-[var(--cf-text-muted)]">
        ${relatedLabel}:{" "}
        <A href="${relatedHref}">
          continue reading
        </A>
        .{" "}
        <A href="/waitlist">Join the Kvika beta</A>.
      </P>
    </article>
  ),
}

export default post
`

  writeFileSync(join(OUT_DIR, `${topic.slug}.tsx`), file, "utf8")
}

const LEGACY_SLUGS = [
  "syncing-google-and-microsoft-calendars-programmatically",
  "stop-losing-action-items-in-your-inbox",
  "scheduling-across-google-and-microsoft-teams",
]

const allSlugs = [...LEGACY_SLUGS, ...slugs]
const registryEntries = allSlugs
  .map((slug) => `  "${slug}": () => import("@/content/blog/${slug}"),`)
  .join("\n")

const registryFile = `import type { BlogPost } from "@/lib/blog"

/** Auto-generated by web/scripts/generate-weekly-blog-posts.mjs — do not edit manually */
export const postModules: Record<string, () => Promise<{ default: BlogPost }>> = {
${registryEntries}
}
`

writeFileSync(join(__dirname, "../lib/blog-registry.ts"), registryFile, "utf8")

console.log(`Generated ${slugs.length} posts in ${OUT_DIR}`)
console.log(`Updated web/lib/blog-registry.ts (${allSlugs.length} total slugs)`)
