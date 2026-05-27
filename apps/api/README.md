# Kyle AI — API

Node.js/Express webhook server powering the Kyle Briere fitness coach bot.

## Setup

1. Copy `.env.example` to `.env` and fill in all values.
2. Run migrations: `pnpm db:migrate`
3. Seed the first admin account:
   ```
   SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=YourStrongPass! pnpm db:seed
   ```
4. Start the dev server: `pnpm dev`

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `OPENAI_API_KEY` | yes | OpenAI API key |
| `MANYCHAT_WEBHOOK_SECRET` | yes | Shared secret for ManyChat HMAC |
| `ADMIN_API_KEY` | yes | Bearer key for admin API routes |
| `JWT_SECRET` | yes | ≥32 char secret for JWT signing |
| `WEB_ORIGIN` | yes | Allowed CORS origin (dashboard URL) |
| `CALENDLY_URL` | no | Booking link; defaults to the Kyle Briere Calendly URL |
| `SLACK_WEBHOOK_URL` | no | Slack incoming webhook for booking alerts |
| `SENTRY_DSN` | no | Sentry DSN for error tracking |
| `PORT` | no | Defaults to 3000 |

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start with hot reload (tsx watch) |
| `pnpm build` | Compile TypeScript |
| `pnpm start` | Run compiled output |
| `pnpm test` | Run test suite |
| `pnpm db:generate` | Generate Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:seed` | Insert/update an admin account (requires SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD) |
