import { neon } from '@neondatabase/serverless';
import { scrypt, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { config } from 'dotenv';

config();

const scryptAsync = promisify(scrypt);

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL required'); process.exit(1); }

const sql = neon(url);

const email = 'kyle@admin.com';
const password = 'Password123!';

const salt = randomBytes(16).toString('hex');
const hash = await scryptAsync(password, salt, 64);
const passwordHash = `${salt}:${hash.toString('hex')}`;

await sql`
  INSERT INTO admins (email, password_hash)
  VALUES (${email}, ${passwordHash})
  ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
`;

console.log(`Seeded admin: ${email}`);
