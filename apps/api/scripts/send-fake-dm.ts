import 'dotenv/config';
import { createHmac } from 'node:crypto';

const args = process.argv.slice(2);

function getArg(flag: string, fallback?: string): string {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required flag: ${flag}`);
}

const userId = getArg('--user-id', `test-${Date.now()}`);
const message = getArg('--message', 'hey');
const platform = getArg('--platform', 'instagram');
const url = getArg('--url', 'http://localhost:3000/webhook');
const firstName = getArg('--first-name', 'TestUser');

const secret = process.env.MANYCHAT_WEBHOOK_SECRET;
if (!secret) {
  console.error('MANYCHAT_WEBHOOK_SECRET is not set in .env');
  process.exit(1);
}

const body = JSON.stringify({ user_id: userId, message, platform, first_name: firstName });
const sig = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

console.log(`POST ${url}`);
console.log(`  user_id:  ${userId}`);
console.log(`  platform: ${platform}`);
console.log(`  message:  ${message}`);
console.log('');

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-manychat-signature': sig,
  },
  body,
});

const text = await res.text();
let pretty: string;
try {
  pretty = JSON.stringify(JSON.parse(text), null, 2);
} catch {
  pretty = text;
}

console.log(`Status: ${res.status}`);
console.log(pretty);
