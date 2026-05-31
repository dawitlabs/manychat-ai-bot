import { Router, Request, Response } from 'express';
import { pgClient } from '../db/client';
import { env } from '../config/env';

const router = Router();
const startTime = Date.now();

router.get('/health', async (_req: Request, res: Response) => {
  let db: 'ok' | 'down' = 'ok';
  try {
    await pgClient`select 1`;
  } catch {
    db = 'down';
  }

  const status = db === 'down' ? 503 : 200;
  res.status(status).json({
    status: db === 'down' ? 'degraded' : 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    db,
    sentry: !!env.SENTRY_DSN,
    openai_configured: !!env.OPENAI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

export default router;
