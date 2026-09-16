# Kvika

**Kvika is a unified productivity platform for software engineers who live across Google and Microsoft.** It merges Gmail and Outlook into one inbox, syncs Google Calendar and Outlook into one view, extracts actionable tasks from email and Teams with AI, and exposes the whole stack to a Bedrock-powered agent that can compose mail, schedule meetings, and draft Jira tickets in a single conversation — with human review before anything sends.

Built as a full-stack TypeScript product: Next.js app, PostgreSQL data model, Redis caching, OAuth integrations with five providers, and AWS CDK infrastructure for a production Bedrock Agent with Lambda action groups.

---

## Why this exists

Most teams are not purely Google or purely Microsoft. Engineers juggle Gmail and Outlook, Google Calendar and Teams meetings, Jira tickets and inbox asks — with no single place that stays in sync. Kvika treats **mixed-stack as the default**, not an edge case: dual OAuth connections, incremental sync per provider, and graceful degradation when directory APIs or tokens fail.

---

## What it does

| Surface | What you get |
|--------|----------------|
| **Unified mail** | One inbox for Gmail + Outlook with incremental sync (`historyId` / `deltaLink`), real-time updates via Pub/Sub, Graph webhooks, and SSE |
| **Unified calendar** | Google + Microsoft events on one grid; event classification (meeting / focus / task); bidirectional sync with conflict detection |
| **Tasks** | Manual capture plus AI extraction from email and Teams; every task links back to the source thread |
| **AI agent** | AWS Bedrock Agent orchestrates compose, reply, meeting prep, and Jira drafts; multi-tool requests in one turn |
| **Team scheduling** | Cross-member free/busy via Microsoft Graph `findMeetingTimes`, with manual fallback when the API returns empty |
| **Analytics** | Focus vs meeting hours, task sources, integration health — computed from existing rows, no metrics warehouse |
| **Focus mode** | Timer and calendar blocks for deep work alongside managed-event rescheduling rules |

Public marketing site, interactive sandbox, engineering blog, and invite-gated beta ([waitlist](https://kvika.work/waitlist)).

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Next.js 15 (App Router) — React 19, TypeScript, Tailwind, shadcn/ui   │
│  Dashboard · Calendar · Mail · Tasks · Focus · Team · Analytics · AI   │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌────────────────────────┐
│  PostgreSQL   │      │    Redis      │      │  External APIs         │
│  (Prisma)     │      │  mail/tasks   │      │  Gmail · Graph · Jira  │
│  Users,       │      │  cache        │      │  GitHub · Gemini /     │
│  Integrations,│      │               │      │  Bedrock               │
│  Calendar,    │      │               │      └───────────┬────────────┘
│  Tasks        │      │               │                  │
└───────────────┘      └───────────────┘                  │
                                                          ▼
                              ┌───────────────────────────────────────────┐
                              │  AWS (CDK)                                │
                              │  Bedrock Agent · Lambda action groups     │
                              │  → internal Next.js API (shared secret)   │
                              └───────────────────────────────────────────┘
```

**Request flow (AI agent):** Browser → `/api/ai/agent` → Bedrock Agent → Lambda (Gmail / Jira / Meeting actions) → secret-protected internal routes → same business logic as the UI (compose, `resolveAttendees`, meeting drafts) → trace extraction → structured UI cards (draft email, scheduler, ticket).

---

## Engineering highlights

These are the problems the codebase actually solves — not slide-deck features.

### Dual-provider incremental mail sync

Gmail and Outlook use different cursor models. The unified dashboard merges incremental updates in a `Map` keyed by message ID: Gmail supplies explicit deletions via `history.list`; Outlook delta returns upserts via `@odata.deltaLink`. Cursors are stored per integration and advanced independently.

### Process-then-advance sync cursors

Task extraction runs an LLM over fetched mail **before** persisting `gmailHistoryId` or `outlookMailDeltaLink`. If extraction fails, cursors stay put so the next run retries the same batch; task creation dedupes on `(sourceId, title)` for idempotent retries.

### Bidirectional calendar sync

Events upsert on `(userId, source, sourceId)`. Local edits set `modifiedLocally`; pull sync detects external time changes and marks `SyncStatus.CONFLICT` instead of silently overwriting. Delete reconciliation is scoped to the sync window so a partial fetch cannot wipe events outside the current range.

### Name → email resolution without over-scoping OAuth

Users and agents pass display names, not addresses. A tiered resolver tries Teams members, contacts mined from the last 400 calendar events (no extra Graph scopes), then live org search with fuzzy scoring — degrading to a person picker when confidence is low.

### Bedrock trace deduplication

Multi-tool agent turns can emit the same Lambda payload in multiple nested trace nodes. A cycle-safe tree walk plus action-specific fingerprints prevents duplicate UI cards when one message triggers compose and schedule in the same turn.

### Analytics without new tables

Dashboard KPIs aggregate `CalendarEvent`, `Task`, and `CalendarSync` at request time: clipped hour sums for focus vs meetings, rule-based insights (stale tasks, sync errors), and period-over-period deltas.

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS 4, Radix/shadcn, Redux Toolkit, Recharts, date-fns, Zod |
| **Backend** | Next.js API Routes, Prisma 6, PostgreSQL, Redis, NextAuth.js |
| **AI** | AWS Bedrock Agent + Runtime, Google Gemini (batch task extraction), structured tool → UI mappers |
| **Integrations** | Gmail API, Microsoft Graph (Mail, Calendar, Teams, OnlineMeetings), Jira, GitHub OAuth |
| **Infrastructure** | AWS CDK (Bedrock Agent, IAM, Lambda), Vercel deployment |
| **Real-time** | Gmail Pub/Sub watch, Graph webhooks, Server-Sent Events to browsers |

---

## Repository layout

```
├── web/                    # Main application (Next.js)
│   ├── app/                # App Router pages and ~70 API routes
│   ├── components/         # UI, calendar, mail, agent drawer, analytics
│   ├── lib/                # Sync, AI, auth, analytics, agent trace parsing
│   ├── prisma/             # Schema and migrations
│   ├── aws/bedrock-agent/  # Lambda handlers + OpenAPI schemas for action groups
│   └── content/blog/       # Engineering blog (sync, agents, mixed-stack ops)
├── infra/                  # AWS CDK — Bedrock Agent stack
└── PROJECT_DOCUMENTATION.md  # Extended internal architecture notes
```

---

## Data model (core entities)

- **User** — OAuth identity, AI consent flag, onboarding state
- **Integration** — per-provider tokens (Google, Microsoft, Jira, GitHub); JSON blob for sync cursors (`gmailHistoryId`, `outlookMailDeltaLink`)
- **CalendarEvent** — normalised events with `eventType`, `isManaged`, `modifiedLocally`, `syncStatus`
- **Task** — unified queue with `source` (`EMAIL_AI`, `TEAMS`, `MANUAL`, …), `sourceId`, deep link `url`
- **CalendarSync** — per-calendar sync health, tokens, error tracking

---

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL
- Redis (optional locally; used for mail/task cache in production)
- Google Cloud + Microsoft Azure OAuth apps (Gmail, Calendar, Graph)
- AWS account (Bedrock Agent — optional for local UI; required for agent chat)

### Web app

```bash
cd web
npm install
cp .env.example .env.local   # or create .env.local — see web/README.md
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Marketing and sandbox are public; app routes require an invited email.

### Bedrock Agent (optional)

```bash
cd infra
npm install
npx cdk deploy \
  --parameters ChronoFlowInternalBaseUrl=https://your-public-url \
  --parameters InternalAgentSecret="$INTERNAL_AGENT_SECRET"
```

Copy stack outputs into `web/.env.local` (`BEDROCK_AGENT_ID`, `BEDROCK_AGENT_ALIAS_ID`, `INTERNAL_AGENT_SECRET`). See [infra/README.md](infra/README.md).

---

## Security and compliance

- OAuth tokens stored server-side per user per provider; refresh handled in API routes with reconnect UX on `invalid_grant`
- Explicit **AI consent** gate before mail or chat content is sent to models
- Per-user **rate limits** on agent and extraction endpoints (Redis-backed)
- Agent Lambdas authenticate to internal APIs via shared secret header — not exposed to browsers
- Privacy-first visit tracking on marketing pages (hashed IPs, no raw storage)

---

## Further reading

Engineering deep-dives live on the [Kvika blog](https://kvika.work/blog), including:

- [Building a unified Gmail + Outlook inbox](https://kvika.work/blog/building-a-unified-gmail-outlook-inbox)
- [Sync cursors and AI pipelines](https://kvika.work/blog/sync-cursors-and-ai-pipelines)
- [Bidirectional calendar sync without losing edits](https://kvika.work/blog/bidirectional-calendar-sync-without-losing-edits)
- [Bedrock agents calling your Next.js API](https://kvika.work/blog/bedrock-agents-calling-your-nextjs-api)

---

## Status

Private beta with invite-gated sign-in. Actively developed — calendar delta sync, webhook subscription renewal, and OAuth single-flight refresh are among the in-progress hardening items documented in the blog.

---

**Kvika** — your calendar, email, and tasks, finally talking to each other.
