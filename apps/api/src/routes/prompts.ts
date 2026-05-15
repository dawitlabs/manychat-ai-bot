import { Router, Request, Response } from 'express';
import { getSettingJson, setSettingJson } from '../services/settings-store';
import { SYSTEM_PROMPT, COMMENT_REPLY_PROMPT } from '../domain/prompts';

const router = Router();

router.get('/prompts', async (_req: Request, res: Response) => {
  const [systemPrompt, commentPrompt] = await Promise.all([
    getSettingJson('system_prompt', SYSTEM_PROMPT),
    getSettingJson('comment_prompt', COMMENT_REPLY_PROMPT),
  ]);
  res.json({ systemPrompt, commentPrompt });
});

router.put('/prompts', async (req: Request, res: Response) => {
  const { systemPrompt, commentPrompt } = req.body as Record<string, string>;
  const ops: Promise<void>[] = [];
  if (typeof systemPrompt === 'string') ops.push(setSettingJson('system_prompt', systemPrompt));
  if (typeof commentPrompt === 'string') ops.push(setSettingJson('comment_prompt', commentPrompt));
  await Promise.all(ops);
  res.json({ ok: true });
});

export default router;
