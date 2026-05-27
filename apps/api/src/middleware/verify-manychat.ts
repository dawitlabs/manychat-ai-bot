import { createHmac, timingSafeEqual } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function verifyManychat(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-manychat-signature'];
  if (!signature || typeof signature !== 'string') {
    res.status(401).json({ error: 'Missing signature' });
    return;
  }

  const rawBody: Buffer | undefined = (req as any).rawBody;
  if (!rawBody) {
    res.status(500).json({ error: 'Raw body unavailable' });
    return;
  }

  const expected = createHmac('sha256', env.MANYCHAT_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'hex');
  const receivedBuf = Buffer.from(signature.replace(/^sha256=/, ''), 'hex');

  if (expectedBuf.length !== receivedBuf.length || !timingSafeEqual(expectedBuf, receivedBuf)) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  next();
}
