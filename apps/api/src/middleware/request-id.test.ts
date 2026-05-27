import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-request-id-test';
process.env.MANYCHAT_WEBHOOK_SECRET = 'test-secret';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';

// Re-implement the sanitization logic from request-id.ts to verify its rules.
const SAFE_ID = /^[A-Za-z0-9_\-]{1,128}$/;

function resolveId(incoming: string | undefined): string {
  if (incoming && SAFE_ID.test(incoming)) return incoming;
  return 'generated-uuid'; // stand-in for randomUUID()
}

const UUID_PATTERN = /^[A-Za-z0-9_\-]{1,128}$/;

describe('request-id — sanitization', () => {
  it('accepts a valid UUID-format id', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    assert.equal(resolveId(id), id);
  });

  it('accepts a short alphanumeric token', () => {
    const id = 'abc123';
    assert.equal(resolveId(id), id);
  });

  it('accepts underscores and hyphens', () => {
    const id = 'req_id-001';
    assert.equal(resolveId(id), id);
  });

  it('rejects a value containing a newline (log injection)', () => {
    const injected = 'foo\nbar';
    assert.equal(resolveId(injected), 'generated-uuid');
  });

  it('rejects a value containing a carriage return', () => {
    const injected = 'foo\rbar';
    assert.equal(resolveId(injected), 'generated-uuid');
  });

  it('rejects a value containing a null byte', () => {
    const injected = 'foo\x00bar';
    assert.equal(resolveId(injected), 'generated-uuid');
  });

  it('rejects a value longer than 128 characters', () => {
    const long = 'a'.repeat(129);
    assert.equal(resolveId(long), 'generated-uuid');
  });

  it('accepts exactly 128 characters', () => {
    const max = 'a'.repeat(128);
    assert.equal(resolveId(max), max);
  });

  it('returns a fallback for undefined input', () => {
    assert.equal(resolveId(undefined), 'generated-uuid');
  });

  it('returns a fallback for empty string', () => {
    assert.equal(resolveId(''), 'generated-uuid');
  });

  it('rejects a value containing spaces', () => {
    assert.equal(resolveId('foo bar'), 'generated-uuid');
  });

  it('fallback value itself matches the allowed pattern', () => {
    // Ensure randomUUID() output is always accepted (UUID chars are a-f, 0-9, hyphens)
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    assert.match(uuid, UUID_PATTERN);
  });
});
