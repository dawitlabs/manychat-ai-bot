import { createHash, timingSafeEqual } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const provided = req.header('x-admin-key') ?? '';
  if (!timingSafeEqual(sha256(provided), sha256(env.ADMIN_API_KEY))) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
