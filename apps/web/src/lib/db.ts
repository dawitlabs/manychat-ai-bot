import postgres from 'postgres';

let _sql: ReturnType<typeof postgres> | null = null;

function getDb(): ReturnType<typeof postgres> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is required');
    _sql = postgres(url, { ssl: 'require', max: 5 });
  }
  return _sql;
}

// Proxy defers connection creation until first use, so the module can be
// imported at build time without DATABASE_URL being set.
const sql = new Proxy(function () {} as unknown as ReturnType<typeof postgres>, {
  apply(_target, _thisArg, args) {
    const db = getDb();
    return (db as unknown as (...a: unknown[]) => unknown)(...args);
  },
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default sql;
