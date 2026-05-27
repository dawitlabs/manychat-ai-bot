import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

const SAFE_ID = /^[A-Za-z0-9_\-]{1,128}$/;

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'] as string | undefined;
  const id = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
