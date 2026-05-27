import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createHmac } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

// Must be set before requiring any module that loads env.ts
process.env.MANYCHAT_WEBHOOK_SECRET = 'test-secret-vm';
process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-test';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';

// Use require() so env vars are set first (import is hoisted by esbuild, require is not)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { verifyManychat } = require('./verify-manychat') as typeof import('./verify-manychat');

function sign(body: Buffer, secret = 'test-secret-vm'): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

function makeReq(
  headers: Record<string, string> = {},
  rawBody?: Buffer,
): Request {
  return { headers, rawBody } as unknown as Request;
}

function capture(): { res: Response; code: () => number | undefined } {
  let code: number | undefined;
  const res = {
    status(n: number) {
      code = n;
      return { json(_b: unknown) {} };
    },
  } as unknown as Response;
  return { res, code: () => code };
}

describe('verifyManychat', () => {
  it('returns 401 when signature header is missing', () => {
    const { res, code } = capture();
    let called = false;
    const next: NextFunction = () => { called = true; };
    verifyManychat(makeReq({}, Buffer.from('{}')), res, next);
    assert.equal(code(), 401);
    assert.equal(called, false);
  });

  it('calls next() for a valid bare-hex signature', () => {
    const body = Buffer.from('{"user_id":"1"}');
    const { res, code } = capture();
    let called = false;
    const next: NextFunction = () => { called = true; };
    verifyManychat(makeReq({ 'x-manychat-signature': sign(body) }, body), res, next);
    assert.equal(called, true);
    assert.equal(code(), undefined);
  });

  it('calls next() for a sha256= prefixed signature', () => {
    const body = Buffer.from('{"user_id":"2"}');
    const { res } = capture();
    let called = false;
    const next: NextFunction = () => { called = true; };
    verifyManychat(makeReq({ 'x-manychat-signature': `sha256=${sign(body)}` }, body), res, next);
    assert.equal(called, true);
  });

  it('returns 401 for a tampered body', () => {
    const body = Buffer.from('{"user_id":"3"}');
    const tampered = Buffer.from('{"user_id":"evil"}');
    const { res, code } = capture();
    let called = false;
    const next: NextFunction = () => { called = true; };
    verifyManychat(makeReq({ 'x-manychat-signature': sign(body) }, tampered), res, next);
    assert.equal(code(), 401);
    assert.equal(called, false);
  });

  it('returns 500 when rawBody is missing', () => {
    const { res, code } = capture();
    let called = false;
    const next: NextFunction = () => { called = true; };
    verifyManychat(makeReq({ 'x-manychat-signature': 'abc' }), res, next);
    assert.equal(code(), 500);
    assert.equal(called, false);
  });
});
