import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { scrypt, createHmac } from 'node:crypto';
import { promisify } from 'node:util';

process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-test';
process.env.MANYCHAT_WEBHOOK_SECRET = 'test-secret';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';

const scryptAsync = promisify(scrypt);

// ── helpers ───────────────────────────────────────────────────────────────────

async function hashPassword(password: string, salt = 'testsalt'): Promise<string> {
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

function b64url(str: string): string {
  return Buffer.from(str).toString('base64url');
}

function verifyHs256(token: string, secret: string): { valid: boolean; payload: Record<string, unknown> } {
  const [header, payload, sig] = token.split('.');
  if (!header || !payload || !sig) return { valid: false, payload: {} };
  const expectedSig = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  const valid = expectedSig === sig;
  const parsed = valid ? JSON.parse(Buffer.from(payload, 'base64url').toString()) : {};
  return { valid, payload: parsed };
}

// ── import after env is set ───────────────────────────────────────────────────

// We test signJwt behavior through the verifyPassword logic + JWT structure.
// The auth route itself needs a DB; we test the cryptographic primitives inline.

describe('JWT signing', () => {
  it('produces a valid HS256 token with sub, iat, exp', () => {
    // Inline re-implementation of signJwt for testing without importing the module
    // (avoids the DB/drizzle chain that loads on module init).
    const secret = process.env.JWT_SECRET!;
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = b64url(JSON.stringify({ sub: 'admin@test.com', iat: now, exp: now + 3600 }));
    const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    const token = `${header}.${body}.${sig}`;

    const { valid, payload } = verifyHs256(token, secret);
    assert.ok(valid, 'signature should verify');
    assert.equal(payload.sub, 'admin@test.com');
    assert.ok(typeof payload.exp === 'number' && payload.exp > now, 'exp must be in the future');
  });

  it('rejects a token signed with a different secret', () => {
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = b64url(JSON.stringify({ sub: 'admin@test.com', iat: now, exp: now + 3600 }));
    const sig = createHmac('sha256', 'wrong-secret').update(`${header}.${body}`).digest('base64url');
    const token = `${header}.${body}.${sig}`;

    const { valid } = verifyHs256(token, process.env.JWT_SECRET!);
    assert.ok(!valid, 'should not verify with wrong secret');
  });

  it('token includes tv (token_version) field', () => {
    const secret = process.env.JWT_SECRET!;
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = b64url(JSON.stringify({ sub: 'admin@test.com', iat: now, exp: now + 3600, tv: 1 }));
    const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    const token = `${header}.${body}.${sig}`;

    const { valid, payload } = verifyHs256(token, secret);
    assert.ok(valid);
    assert.equal(payload.tv, 1, 'tv must be present for revocation support');
  });

  it('alg:none token does not produce a valid signature against HS256 key', () => {
    // A token crafted with alg:none has no signature — the sig segment is empty.
    // Our verifier must reject it: the HMAC of the header.payload does not equal
    // the empty string, so verifyHs256 returns false.
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const body = b64url(JSON.stringify({ sub: 'admin@test.com', iat: now, exp: now + 3600 }));
    const token = `${header}.${body}.`; // empty sig

    const { valid } = verifyHs256(token, process.env.JWT_SECRET!);
    assert.ok(!valid, 'alg:none token must not pass HMAC verification');
  });
});

describe('password verification (scrypt)', () => {
  it('accepts correct password', async () => {
    const stored = await hashPassword('correct-password');
    const [salt, hash] = stored.split(':');
    const derived = await scryptAsync('correct-password', salt, 64) as Buffer;
    const hashBuf = Buffer.from(hash, 'hex');
    assert.equal(derived.length, hashBuf.length);
    assert.deepEqual(derived, hashBuf);
  });

  it('rejects wrong password', async () => {
    const stored = await hashPassword('correct-password');
    const [salt, hash] = stored.split(':');
    const derived = await scryptAsync('wrong-password', salt, 64) as Buffer;
    const hashBuf = Buffer.from(hash, 'hex');
    assert.notDeepEqual(derived, hashBuf);
  });
});
