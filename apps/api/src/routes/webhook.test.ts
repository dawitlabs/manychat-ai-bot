import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createHmac } from 'node:crypto';
import type { Request, Response } from 'express';

// Must be set before requiring any module that loads env.ts
process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-test';
process.env.MANYCHAT_WEBHOOK_SECRET = 'webhook-test-secret';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';

// Use require() so env vars are set first (import is hoisted by esbuild, require is not)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { verifyManychat } = require('../middleware/verify-manychat') as typeof import('../middleware/verify-manychat');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { webhookLimiter } = require('../middleware/rate-limit') as typeof import('../middleware/rate-limit');

const SECRET = 'webhook-test-secret';

function sign(body: Buffer, secret = SECRET): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

function makeReq(
  headers: Record<string, string> = {},
  rawBody?: Buffer,
): Request {
  return { headers, rawBody } as unknown as Request;
}

function capture(): { res: Response; code: () => number | undefined; body: () => unknown } {
  let code: number | undefined;
  let sentBody: unknown;
  const res = {
    status(n: number) {
      code = n;
      return {
        json(b: unknown) { sentBody = b; },
      };
    },
    json(b: unknown) { sentBody = b; },
  } as unknown as Response;
  return { res, code: () => code, body: () => sentBody };
}

describe('verifyManychat on webhook body', () => {
  it('returns 401 when x-manychat-signature is missing', () => {
    const rawBody = Buffer.from('{"user_id":"1","message":"hi"}');
    const { res, code } = capture();
    let called = false;
    verifyManychat(makeReq({}, rawBody), res, () => { called = true; });
    assert.equal(code(), 401);
    assert.equal(called, false);
  });

  it('calls next() for a valid bare-hex signature', () => {
    const rawBody = Buffer.from('{"user_id":"2","message":"hello"}');
    const { res } = capture();
    let called = false;
    verifyManychat(
      makeReq({ 'x-manychat-signature': sign(rawBody) }, rawBody),
      res,
      () => { called = true; },
    );
    assert.equal(called, true);
  });

  it('calls next() for a sha256= prefixed signature', () => {
    const rawBody = Buffer.from('{"user_id":"3","message":"hey"}');
    const { res } = capture();
    let called = false;
    verifyManychat(
      makeReq({ 'x-manychat-signature': `sha256=${sign(rawBody)}` }, rawBody),
      res,
      () => { called = true; },
    );
    assert.equal(called, true);
  });

  it('returns 401 for a tampered body', () => {
    const original = Buffer.from('{"user_id":"4","message":"legit"}');
    const tampered = Buffer.from('{"user_id":"4","message":"evil"}');
    const { res, code } = capture();
    let called = false;
    verifyManychat(
      makeReq({ 'x-manychat-signature': sign(original) }, tampered),
      res,
      () => { called = true; },
    );
    assert.equal(code(), 401);
    assert.equal(called, false);
  });

  it('returns 401 for a wrong-secret signature', () => {
    const rawBody = Buffer.from('{"user_id":"5","message":"test"}');
    const { res, code } = capture();
    let called = false;
    verifyManychat(
      makeReq({ 'x-manychat-signature': sign(rawBody, 'wrong-secret') }, rawBody),
      res,
      () => { called = true; },
    );
    assert.equal(code(), 401);
    assert.equal(called, false);
  });

  it('returns 500 when rawBody is missing', () => {
    const { res, code } = capture();
    let called = false;
    verifyManychat(makeReq({ 'x-manychat-signature': 'abc' }), res, () => { called = true; });
    assert.equal(code(), 500);
    assert.equal(called, false);
  });
});

describe('webhookLimiter middleware ordering', () => {
  // The limiter must run BEFORE verifyManychat to reject flood traffic
  // before the expensive HMAC compare. This test confirms the limiter calls next()
  // on the first request (proving it's a real rate-limiter middleware).
  it('calls next() on the first request (within rate limit)', (_, done) => {
    const req = {
      headers: {},
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
