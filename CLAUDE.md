# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

pnpm monorepo for a ManyChat + OpenAI fitness coach bot. The AI impersonates "Kyle Briere" of Large Dumbbells, following a scripted 6-step sales funnel to qualify leads on Instagram/Facebook DMs and book them onto a Calendly call.

**Apps:**
- `apps/api` — TypeScript/Express webhook server (the core bot logic, Postgres-backed)
- `apps/web` — Next.js 16 operator dashboard
- `apps/landing` — Next.js 15 marketing site
- `apps/admin` — Next.js 16 placeholder (parked)

## Commands

```bash
# Install all dependencies
pnpm install

# Run all apps in parallel
pnpm dev

# Run individual apps
pnpm dev:api       # tsx watch on port 3000
pnpm dev:web       # Next.js dev server (apps/web)
pnpm dev:landing   # Next.js dev server (apps/landing)

# Build frontends
pnpm build         # web + admin + landing

# API quality
pnpm --filter @manychat-bot/api typecheck   # tsc --noEmit
pnpm --filter @manychat-bot/api lint        # eslint src
pnpm --filter @manychat-bot/api test        # tsx --test src/**/*.test.ts

# API database
pnpm --filter @manychat-bot/api db:generate  # generate Drizzle migration
pnpm --filter @manychat-bot/api db:migrate   # run migrations
pnpm --filter @manychat-bot/api db:seed      # seed admin user

# CI runs typecheck → lint → test on every PR (see .github/workflows/ci.yml)
```

Each app also has its own `package.json` scripts runnable via `pnpm --filter @manychat-bot/<api|web|admin|landing> <script>`.

## Architecture

### API (`apps/api`) — the core bot

**Stack:** TypeScript / Express 4 / Drizzle ORM / Postgres (Neon, postgres-js driver) / OpenAI / pg-boss. Deployed on Render (`render.yaml`). Entrypoint: `src/server.ts`.

**Inbound DM flow** (`src/routes/webhook.ts`):
1. Auth: `X-Manychat-Secret` header (query-param `?secret=` accepted as deprecated fallback)
2. Zod validation → idempotency replay → settings load → kill-switch check
3. Upsert conversation → pause check
4. Direct-answer rule table (`src/services/direct-answers.ts`) — short-circuits OpenAI for common questions including booking intent
5. Prompt resolution: booking-link swap + post context + knowledge injection
6. `generateReply` (OpenAI) → `formatKyleReply` → persist messages
7. Enqueue `classify-conversation` job (pg-boss) — durable, survives restarts
8. All wrapped in `withMcTimeout` (4.5s) so ManyChat always gets a reply

**Background jobs** (`src/services/jobs.ts`, pg-boss):
- `classify-conversation` — calls OpenAI classify, updates conversation status with optimistic locking, emits `booked` event + enqueues `notify-booking` on Booked transition
- `notify-booking` — posts Slack alert
- `expire-conversations` — cron every 30 min, archives TTL-expired conversations

**Conversation state** (Postgres, `src/services/conversation-store.ts`):
- `conversations` table: `user_id` PK, status, funnel_step, paused, `version` (optimistic locking), 23h TTL → Archived
- `messages` table: append-only, FK cascade, rolling 40-msg window
- `conversation_events` table: immutable audit log (status_changed, booked, paused, resumed)

**Prompts** (`src/domain/prompts.ts`): `SYSTEM_PROMPT` (Kyle persona, 6-step funnel, objection scripts, few-shot examples) + `COMMENT_REPLY_PROMPT`. Booking link is regex-swapped at runtime from `bot_settings.bookingLink ?? env.CALENDLY_URL`.

**ManyChat response format:** `{ version: "v2", content: { messages: [{ type: "text", text: "..." }] } }`. Note: Instagram drops all bubbles after the first — `toManyChatTextMessages` joins them with `\n\n`.

**Endpoints:**
- `POST /webhook` — inbound DMs (ManyChat)
- `POST /comment` — comment-triggered opening DMs (ManyChat)
- `POST /reset` / `POST /reset-all` — clear conversation history
- `GET /health` — liveness + DB ping
- `GET /metrics` — Prometheus scrape (counters + histograms: webhook requests/latency, OpenAI calls/latency, direct-answer hits, outbound timeouts, Booked transitions)
- Admin routes (`requireAdmin` middleware, `x-admin-key` header): `/conversations`, `/stats`, `/auth/*`, `/prompts`, `/bot-settings`, `/leads`, `/templates`, `/posts`, `/knowledge`

**DB schema** (`src/db/schema.ts`, 10 tables): `admins`, `conversations`, `messages`, `settings`, `admin_audit`, `posts`, `knowledge_items`, `inbound_events`, `openai_usage`, `conversation_events`. Migrations in `drizzle/`. pgboss schema managed by pg-boss itself.

**Observability:** Sentry (errors + traces, `tracesSampleRate: 0.2` prod), structured JSON logs (`src/lib/logger.ts`), Prometheus metrics (`src/lib/metrics.ts`), `req.id` threaded into job payloads for log correlation.

### Next.js Apps

**`apps/web`** — Operator dashboard. Next.js 16 App Router, feature-folder architecture under `src/features/`. Talks to the API via internal proxy (`src/app/api/proxy/[...path]/route.ts`). TanStack Query for data fetching (`src/lib/api-client.ts`). Routes: overview, conversations, chat, leads, pipeline, analytics, ai-control, knowledge, posts, templates, settings, reports, integrations, objections, notifications.

**`apps/landing`** — Marketing site. Next.js 15, 15 section components under `src/components/`. Separate Vercel deployment.

**`apps/admin`** — Bare scaffold, parked.

## Environment Variables

Copy `apps/api/.env.example` to `apps/api/.env`. Required:

```
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
WEB_ORIGIN=http://localhost:3001
MANYCHAT_WEBHOOK_SECRET=<min-32-chars>
ADMIN_API_KEY=<secret>
JWT_SECRET=<min-32-chars>
```

Optional: `CALENDLY_URL`, `SLACK_WEBHOOK_URL`, `SENTRY_DSN`, `PORT` (default 3000), `LOG_LEVEL` (debug|info).

## The Funnel (`SYSTEM_PROMPT`)

6-step qualification funnel encoded in `src/domain/prompts.ts`:
1. Journey/opening
2. Timeline/game plan
3. Nutrition check
4. Pain/struggle
5. Offer + pitch
6. Pivot to 20-min call → booking link

**Do not reorder or abbreviate these steps** — the funnel flow is the core product logic. Objection scripts (price, "what do you offer", free call) and NEVER rules are part of the same prompt. Editing is done via `PUT /prompts` (stored in `settings` table, falls back to the hardcoded default).

## Key Design Decisions

See `docs/adr/` for full context:
- `0001` — Bot settings stored as DB rows (not embedded in prompt), enabling white-labelling
- `0002` — Durable job queue (pg-boss) for background classification and notifications
- `0003` — Append-only `conversation_events` log for auditable state transitions
- `0004` — Webhook auth via `X-Manychat-Secret` header (not URL query param)

## Agent Skills

### Issue tracker
Issues live in GitHub Issues (`dawitlabs/manychat-ai-bot`). See `docs/agents/issue-tracker.md`.

### Triage labels
`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs
Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
