import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL required'); process.exit(1); }

const sql = postgres(url, { ssl: 'require', max: 1, connect_timeout: 15 });

await sql.unsafe(`
  CREATE TABLE IF NOT EXISTS "conversations" (
    "user_id" text PRIMARY KEY NOT NULL,
    "first_name" text,
    "platform" text NOT NULL,
    "source" text NOT NULL,
    "started_from_comment" text,
    "last_activity" timestamptz NOT NULL DEFAULT now(),
    "created_at" timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS "messages" (
    "id" bigserial PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL REFERENCES "conversations"("user_id") ON DELETE CASCADE,
    "role" text NOT NULL,
    "content" text NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS "messages_user_id_created_at_idx"
    ON "messages" ("user_id", "created_at");

  CREATE TABLE IF NOT EXISTS "admins" (
    "id" bigserial PRIMARY KEY NOT NULL,
    "email" text NOT NULL UNIQUE,
    "password_hash" text NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now()
  );
`);

console.log('Migration complete.');
await sql.end();
