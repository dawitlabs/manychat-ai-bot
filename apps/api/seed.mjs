import https from 'node:https';
import dns from 'node:dns';
import { scrypt, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { config } from 'dotenv';

config();
dns.setDefaultResultOrder('ipv4first');

const scryptAsync = promisify(scrypt);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) { console.error('DATABASE_URL required'); process.exit(1); }

const parsed = new URL(connectionString);
const httpHost = parsed.hostname.replace('-pooler', '');
const [ip] = await dns.promises.resolve4(httpHost);

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql, params });
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

const email = 'kyle@admin.com';
const password = 'Password123!';

const salt = randomBytes(16).toString('hex');
const hash = await scryptAsync(password, salt, 64);
const passwordHash = `${salt}:${hash.toString('hex')}`;

await query(
  `INSERT INTO admins (email, password_hash) VALUES ($1, $2)
   ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
  [email, passwordHash]
);

console.log(`Seeded admin: ${email}`);
