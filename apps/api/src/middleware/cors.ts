import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

const allowedOrigins = new Set(
  env.WEB_ORIGIN
    ? env.WEB_ORIGIN.split(',').map((o) => o.trim())
    : ['*'],
);

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin ?? '';
  const allow = allowedOrigins.has('*') || allowedOrigins.has(origin) ? origin || '*' : '';

  if (allow) res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
}
