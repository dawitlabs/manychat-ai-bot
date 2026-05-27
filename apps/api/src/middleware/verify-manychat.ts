import { timingSafeEqual } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function verifyManychat(req: Request, res: Response, next: NextFunction): void {
  const secret = typeof req.query.secret === 'string' ? req.query.secret : '';
  const expected = Buffer.from(env.MANYCHAT_WEBHOOK_SECRET);
  const received = Buffer.from(secret);

  if (
    received.length === 0 ||
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
