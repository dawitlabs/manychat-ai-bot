import { config } from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) { console.error('DATABASE_URL required'); process.exit(1); }

const __dirname = dirname(fileURLToPath(import.meta.url));

const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

await migrate(db, { migrationsFolder: join(__dirname, 'drizzle') });
await sql.end();

console.log('Migration complete.');
