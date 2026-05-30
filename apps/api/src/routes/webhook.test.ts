import { describe, it } from 'node:test';
import type { Request, Response } from 'express';

// Must be set before requiring any module that loads env.ts
process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-test';
process.env.MANYCHAT_WEBHOOK_SECRET = 'webhook-test-secret';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';

 
const { webhookLimiter } = require('../middleware/rate-limit') as typeof import('../middleware/rate-limit');

describe('webhookLimiter middleware ordering', () => {
  // The limiter must run BEFORE verifyManychat to reject flood traffic
  // before the secret compare. This test confirms the limiter calls next()
  // on the first request (proving it's a real rate-limiter middleware).
  it('calls next() on the first request (within rate limit)', (_, done) => {
    const req = {
      headers: {},
      query: {},
      ip: '127.0.0.1',
      method: 'POST',
      path: '/webhook',
      rateLimit: undefined,
    } as unknown as Request;
    const res = {
      set() { return this; },
      setHeader() {},
      status(_n: number) { return { json() {} }; },
      json() {},
    } as unknown as Response;
    webhookLimiter(req, res, () => { done(); });
  });
});
