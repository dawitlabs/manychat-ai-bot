import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { settings } from '../db/schema';

const TTL_MS = 30_000;

interface CacheEntry { value: string; expiresAt: number }
const cache = new Map<string, CacheEntry>();

export async function getSetting(key: string): Promise<string | null> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  const value = row?.value ?? null;
  if (value !== null) cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
  return value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value, updated_at: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updated_at: new Date() } });
  // Invalidate so next read reflects the write immediately
  cache.delete(key);
}

export async function getSettingJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await getSetting(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export async function setSettingJson(key: string, value: unknown): Promise<void> {
  await setSetting(key, JSON.stringify(value));
}
