import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { settings } from '../db/schema';
import { requireAdmin } from '../middleware/require-admin';
import { getSettingJson } from '../services/settings-store';
import { env } from '../config/env';
import { log } from '../lib/logger';

const DEFAULTS = {
  botActive: true,
  model: 'gpt-4o-mini',
  maxTokens: 350,
  temperature: 0.4,
  ttl: 23,
  maxHistory: 40,
  bookingLink: env.CALENDLY_URL,
  instagramUrl: '',
  facebookUrl: '',
  avgDealSize: 2850,
  estCloseRate: 0.35,
};

const settingsSchema = z.object({
  botActive: z.boolean().optional(),
  model: z.enum(['gpt-4o-mini', 'gpt-4o', 'gpt-4o-2024-11-20']).optional(),
  maxTokens: z.number().int().min(40).max(2000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  ttl: z.number().int().min(1).max(168).optional(),
  maxHistory: z.number().int().min(2).max(200).optional(),
  bookingLink: z.string().url().optional(),
  instagramUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  avgDealSize: z.number().positive().optional(),
  estCloseRate: z.number().min(0).max(1).optional(),
}).strict();

const router = Router();

router.get('/bot-settings', requireAdmin, async (_req: Request, res: Response) => {
  const data = await getSettingJson('bot_settings', DEFAULTS);
  res.json(data);
});

router.put('/bot-settings', requireAdmin, async (req: Request, res: Response) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    const body = process.env.NODE_ENV !== 'production'
      ? { error: 'Invalid settings', issues: parsed.error.flatten() }
      : { error: 'Invalid request' };
    res.status(400).json(body);
    return;
  }

  const updated = await db.transaction(async (tx) => {
    const rows = await tx.select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, 'bot_settings'))
      .limit(1);
    let current: typeof DEFAULTS = DEFAULTS;
    if (rows[0]) {
      try { current = JSON.parse(rows[0].value) as typeof DEFAULTS; }
      catch { log.warn('[bot-settings] stored value is not valid JSON — falling back to defaults'); }
    }
    const merged = { ...current, ...parsed.data };
    const value = JSON.stringify(merged);
    await tx.insert(settings)
      .values({ key: 'bot_settings', value, updated_at: new Date() })
      .onConflictDoUpdate({ target: settings.key, set: { value, updated_at: new Date() } });
    return merged;
  });

  res.json(updated);
});

export default router;
