import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

const allowedOrigins = new Set(env.WEB_ORIGIN.split(',').map((o) => o.trim()));

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin ?? '';
  if (allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key, x-csrf-token, x-request-id');
  res.setHeader('Access-Control-Expose-Headers', 'X-Request-Id');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
}
