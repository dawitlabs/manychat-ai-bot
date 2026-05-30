# Webhook authentication via X-Manychat-Secret header

Inbound ManyChat webhooks (`POST /webhook`, `POST /comment`) are authenticated by comparing an `X-Manychat-Secret` request header against `MANYCHAT_WEBHOOK_SECRET` using `timingSafeEqual`. A `?secret=` query-parameter fallback is accepted during migration but logs a deprecation warning.

The previous implementation read the secret from the URL query string (`?secret=...`). Query strings are written verbatim into HTTP access logs, reverse-proxy logs, and Sentry's request-URL capture. A single log export or Sentry breach would expose the webhook secret, allowing an attacker to inject arbitrary DMs as Kyle and trigger unlimited OpenAI spend.

The codebase already captured `req.rawBody` for a planned HMAC verification that was never completed. That dead code (`verify` callback in `server.ts`) has been removed.

ManyChat's External Request block supports custom headers, so the migration path is: add `X-Manychat-Secret: <value>` in ManyChat config, remove `?secret=` from the webhook URL, confirm the deprecation warning stops appearing in logs, then delete the query-param branch from `verify-manychat.ts`.

Note: HMAC body signing was not implemented because ManyChat does not sign request bodies — the secret-in-header pattern is the correct solution for this platform.
