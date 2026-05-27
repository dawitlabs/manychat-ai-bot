import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getSettingJson, setSettingJson } from '../services/settings-store';
import { SYSTEM_PROMPT, COMMENT_REPLY_PROMPT } from '../domain/prompts';
import { requireAdmin } from '../middleware/require-admin';

const promptsSchema = z.object({
  systemPrompt: z.string().max(50_000).optional(),
  commentPrompt: z.string().max(50_000).optional(),
});

const router = Router();

router.get('/prompts', requireAdmin, async (_req: Request, res: Response) => {
  const [systemPrompt, commentPrompt] = await Promise.all([
    getSettingJson('system_prompt', SYSTEM_PROMPT),
    getSettingJson('comment_prompt', COMMENT_REPLY_PROMPT),
  ]);
  res.json({ systemPrompt, commentPrompt });
});

router.put('/prompts', requireAdmin, async (req: Request, res: Response) => {
  const parsed = promptsSchema.safeParse(req.body);
  if (!parsed.success) {
    const body = process.env.NODE_ENV !== 'production'
      ? { error: 'Invalid prompts', issues: parsed.error.flatten() }
      : { error: 'Invalid request' };
    res.status(400).json(body);
    return;
  }
  const { systemPrompt, commentPrompt } = parsed.data;
  const ops: Promise<void>[] = [];
  if (typeof systemPrompt === 'string') ops.push(setSettingJson('system_prompt', systemPrompt));
  if (typeof commentPrompt === 'string') ops.push(setSettingJson('comment_prompt', commentPrompt));
  await Promise.all(ops);
  res.json({ ok: true });
});

export default router;
