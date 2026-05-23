import { Router, Request, Response } from 'express';
import { getSettingJson, setSettingJson } from '../services/settings-store';

const DEFAULTS = {
  botActive: true,
  model: 'gpt-4o-mini',
  maxTokens: 220,
  temperature: 0.4,
  maxHistory: 40,
  bookingLink: 'https://calendly.com/kyle-briere-largedumbbells/30',
};

const router = Router();

router.get('/bot-settings', async (_req: Request, res: Response) => {
  const data = await getSettingJson('bot_settings', DEFAULTS);
  res.json(data);
});

router.put('/bot-settings', async (req: Request, res: Response) => {
  const current = await getSettingJson('bot_settings', DEFAULTS);
  const updated = { ...current, ...req.body };
  await setSettingJson('bot_settings', updated);
  res.json(updated);
});

export default router;
