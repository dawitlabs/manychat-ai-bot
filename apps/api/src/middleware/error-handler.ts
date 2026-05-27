import { Request, Response, NextFunction } from 'express';
import { Sentry } from '../config/sentry';
import { log } from '../lib/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  Sentry.captureException(err);
  log.withRequest(req).error('Unhandled error', { message: err.message });
  const isManychatRoute = req.path === '/webhook' || req.path === '/comment';
  if (isManychatRoute) {
    res.status(500).json({
      version: 'v2',
      content: { messages: [{ type: 'text', text: "Sorry, I'm having trouble right now. Please try again in a moment!" }] },
    });
  } else {
    const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    const message = isDev ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
}
