import https from 'node:https';
import dns from 'node:dns';
import { config } from 'dotenv';

config();
dns.setDefaultResultOrder('ipv4first');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) { console.error('DATABASE_URL required'); process.exit(1); }

const parsed = new URL(connectionString);
const httpHost = parsed.hostname.replace('-pooler', '');
const [ip] = await dns.promises.resolve4(httpHost);

function query(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql, params: [] });
    const req = https.request({
      host: ip,
      servername: httpHost,
      path: '/sql',
      method: 'POST',
      headers: {
        'Neon-Connection-String': connectionString,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${text}`));
        else resolve(JSON.parse(text));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

await query(`CREATE TABLE IF NOT EXISTS "conversations" (
  "user_id" text PRIMARY KEY NOT NULL,
  "first_name" text,
  "platform" text NOT NULL,
  "source" text NOT NULL,
  "started_from_comment" text,
  "last_activity" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now()
)`);

await query(`CREATE TABLE IF NOT EXISTS "messages" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "conversations"("user_id") ON DELETE CASCADE,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
)`);

await query(`CREATE INDEX IF NOT EXISTS "messages_user_id_created_at_idx" ON "messages" ("user_id", "created_at")`);

await query(`CREATE TABLE IF NOT EXISTS "admins" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
)`);

console.log('Migration complete.');
