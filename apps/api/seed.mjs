import { scrypt, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { config } from 'dotenv';
import postgres from 'postgres';

config();

const scryptAsync = promisify(scrypt);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) { console.error('DATABASE_URL required'); process.exit(1); }

const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
if (!email) { console.error('SEED_ADMIN_EMAIL required'); process.exit(1); }
if (!password) { console.error('SEED_ADMIN_PASSWORD required'); process.exit(1); }

const sql = postgres(connectionString);

const salt = randomBytes(16).toString('hex');
const hash = await scryptAsync(password, salt, 64);
const passwordHash = `${salt}:${hash.toString('hex')}`;

await sql`
  INSERT INTO admins (email, password_hash)
  VALUES (${email}, ${passwordHash})
  ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
`;

console.log(`Seeded admin: ${email}`);
await sql.end();
