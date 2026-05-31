import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request, Response } from 'express';

const SECRET = 'test-secret-vm-at-least-32-chars!!';

process.env.MANYCHAT_WEBHOOK_SECRET = SECRET;
process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-test-key-at-least-32-chars!!';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';


const { verifyManychat } = require('./verify-manychat') as typeof import('./verify-manychat');

function makeReqHeader(secret?: string): Request {
  return { query: {}, headers: secret !== undefined ? { 'x-manychat-secret': secret } : {}, header(name: string) { return (this.headers as Record<string, string>)[name.toLowerCase()]; } } as unknown as Request;
}

function makeReqQuery(secret?: string): Request {
  return { query: secret !== undefined ? { secret } : {}, headers: {}, header(_name: string) { return undefined; } } as unknown as Request;
}

function capture(): { res: Response; code: () => number | undefined } {
  let code: number | undefined;
  const res = {
    status(n: number) { code = n; return { json(_b: unknown) {} }; },
  } as unknown as Response;
  return { res, code: () => code };
}

describe('verifyManychat', () => {
  it('returns 401 when neither header nor query param is present', () => {
    const { res, code } = capture();
    let called = false;
    verifyManychat(makeReqHeader(), res, () => { called = true; });
    assert.equal(code(), 401);
    assert.equal(called, false);
  });

  it('returns 401 for a wrong header secret', () => {
    const { res, code } = capture();
    let called = false;
    verifyManychat(makeReqHeader('wrong-secret'), res, () => { called = true; });
    assert.equal(code(), 401);
    assert.equal(called, false);
  });

  it('calls next() for the correct header secret', () => {
    const { res, code } = capture();
    let called = false;
    verifyManychat(makeReqHeader(SECRET), res, () => { called = true; });
    assert.equal(called, true);
    assert.equal(code(), undefined);
  });

  it('calls next() for the correct query-param secret (deprecated fallback)', () => {
    const { res, code } = capture();
    let called = false;
    verifyManychat(makeReqQuery(SECRET), res, () => { called = true; });
    assert.equal(called, true);
    assert.equal(code(), undefined);
  });

  it('returns 401 for an empty secret', () => {
    const { res, code } = capture();
    let called = false;
    verifyManychat(makeReqHeader(''), res, () => { called = true; });
    assert.equal(code(), 401);
    assert.equal(called, false);
  });
});
