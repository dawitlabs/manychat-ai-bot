import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env';
import * as schema from './schema';

const pg = postgres(env.DATABASE_URL, { max: 10 });
export const db = drizzle(pg, { schema });
export { pg as pgClient };
