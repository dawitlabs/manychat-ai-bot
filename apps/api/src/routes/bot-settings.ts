import { Router, Request, Response } from 'express';
import { requireApiKey } from '../middleware/api-key';
import { getSettingJson, setSettingJson } from '../services/settings-store';

const DEFAULTS = {
  botActive: true,
  model: 'gpt-4o-mini',
  maxTokens: 300,
  temperature: 0.7,
  ttl: 23,
  maxHistory: 20,
  bookingLink: 'https://calendly.com/kyle-briere-largedumbbells/30',
};

const router = Router();

router.get('/bot-settings', requireApiKey, async (_req: Request, res: Response) => {
  const data = await getSettingJson('bot_settings', DEFAULTS);
  res.json(data);
});

router.put('/bot-settings', requireApiKey, async (req: Request, res: Response) => {
  const current = await getSettingJson('bot_settings', DEFAULTS);
  const updated = { ...current, ...req.body };
  await setSettingJson('bot_settings', updated);
  res.json(updated);
});

export default router;
