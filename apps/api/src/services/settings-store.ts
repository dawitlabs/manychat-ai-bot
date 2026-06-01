import { eq } from 'drizzle-orm';
import { db, pgClient } from '../db/client';
import { settings } from '../db/schema';
import { log } from '../lib/logger';

const TTL_MS = 30_000;
const INVALIDATE_CHANNEL = 'settings_changed';

interface CacheEntry { value: string; expiresAt: number }
const cache = new Map<string, CacheEntry>();

/**
 * Subscribe to cross-instance cache invalidation. Without this, a setting written on one
 * instance stays cached (up to TTL_MS) on every other instance — so the kill-switch and
 * prompt edits would take up to 30s to propagate fleet-wide. Best-effort: on failure we
 * fall back to TTL-only invalidation.
 */
export async function startSettingsInvalidation(): Promise<void> {
  try {
    await pgClient.listen(INVALIDATE_CHANNEL, (key: string) => {
      if (key) cache.delete(key);
    });
    log.info('[settings] cross-instance cache invalidation active');
  } catch (err) {
    log.warn('[settings] LISTEN failed — using TTL-only invalidation', { message: (err as Error).message });
  }
}

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
  // Invalidate locally now, and broadcast so other instances drop their cached copy too.
  cache.delete(key);
  void pgClient.notify(INVALIDATE_CHANNEL, key).catch(() => { /* best effort — TTL covers the gap */ });
}

export async function getSettingJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await getSetting(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export async function setSettingJson(key: string, value: unknown): Promise<void> {
  await setSetting(key, JSON.stringify(value));
}
