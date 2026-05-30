# Durable job queue for background classification and notifications

Background work (OpenAI conversation classification, Slack booking alerts, TTL expiry sweep) is executed via **pg-boss** (a Postgres-backed job queue) rather than in-process fire-and-forget promises.

The previous approach used `void promise.then(...).catch(...)` inside the request handler. This meant any background work in flight at deploy or crash time was silently lost, and the TTL sweep relied on a module-level `lastExpiryRun` timestamp that was per-process — incorrect when multiple instances ran concurrently.

pg-boss was chosen over Redis-based alternatives (BullMQ, etc.) because it reuses the existing `DATABASE_URL` with no additional infrastructure. Jobs are persisted in a `pgboss` schema within the same Postgres DB, survive process restarts, and are dequeued with advisory locks so multiple instances do not double-process the same job.

The alternative — accepting lost background work — was rejected because a missed classification means the funnel step and status are stale, and a missed booking notification means the operator doesn't know a lead converted.
