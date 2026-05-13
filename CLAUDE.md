# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a pnpm monorepo (`pnpm-workspace.yaml`) for a ManyChat + OpenAI fitness coach bot. The AI impersonates "Kyle," a men's fitness coach, following a scripted sales funnel to qualify leads on Instagram/Facebook DMs and book them onto a Calendly call.

**Apps:**
- `apps/api` — Node.js/Express webhook server (the core bot logic)
- `apps/web` — Next.js 16 public-facing frontend
- `apps/admin` — Next.js 16 admin panel

## Commands

```bash
# Install all dependencies
pnpm install

# Run all apps in parallel
pnpm dev

# Run individual apps
pnpm dev:api       # nodemon apps/api/server.js on port 3000
pnpm dev:web       # Next.js dev server for apps/web
pnpm dev:admin     # Next.js dev server for apps/admin

# Build frontends
pnpm build         # builds both web and admin

# Lint (run from within an app directory)
pnpm lint

# API only — no test suite exists
```

Each app also has its own `package.json` scripts runnable via `pnpm --filter @manychat-bot/<api|web|admin> <script>`.

## Architecture

### API (`apps/api/server.js`)

Single-file Express server with three endpoints:

- `POST /comment` — Called by ManyChat when a user **comments on a post**. Generates a personalized first DM using `COMMENT_REPLY_PROMPT`. Stores the reply as the start of conversation history.
- `POST /webhook` — Called by ManyChat for **ongoing DM replies**. Feeds full conversation history plus the `SYSTEM_PROMPT` to OpenAI (`gpt-4o-mini`) and returns the AI reply.
- `POST /reset` — Clears a user's conversation history by `user_id`.
- `GET /health` — Liveness check.

**Conversation state** is held in a module-level `Map<user_id, {messages, lastActivity, source}>`. History expires after 23 hours (matching Instagram's 24h messaging window) and is capped at 20 messages. **This is in-memory only — restarts lose all state.** The README notes Redis/MongoDB as the production upgrade path.

**ManyChat response format** must always be `{ version: "v2", content: { messages: [{ type: "text", text: "..." }] } }`.

### The Funnel (`SYSTEM_PROMPT`)

The system prompt encodes a 6-step qualification funnel (Goal → Nutrition → Struggle → Offer Help → Pivot to Call → Send Booking Link) with specific objection-handling scripts for price, "what do you offer", free call, and silence. It also includes 10 real conversation transcripts to train tone. **Do not reorder or abbreviate these steps** — the funnel flow is the core product logic.

### Next.js Apps (`apps/web`, `apps/admin`)

Both are scaffolded Next.js 16 apps (React 19, Tailwind CSS v4, TypeScript). They are currently empty (default Next.js pages only). **Important:** Next.js 16 has breaking API/convention changes from earlier versions. Before writing any Next.js code, read the guide at `node_modules/next/dist/docs/` within the relevant app.

## Environment Variables

Copy `apps/api/.env.example` to `apps/api/.env`:

```
OPENAI_API_KEY=sk-...
PORT=3000          # optional, defaults to 3000
```

The root `.env.example` mirrors the same variables for convenience.
