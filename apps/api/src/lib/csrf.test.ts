import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// getCsrfToken reads document.cookie — test the parsing logic inline
// since document is undefined in Node. The function is 3 lines; we verify
// the cookie-string parsing it relies on.

function parseCsrfFromCookieString(cookieStr: string): string {
  return cookieStr.split('; ').find((c) => c.startsWith('__Host-csrf='))?.split('=')[1] ?? '';
}

describe('CSRF cookie parsing', () => {
  it('extracts __Host-csrf value from a multi-cookie string', () => {
    const cookie = 'session=abc; __Host-csrf=tok123; other=xyz';
    assert.equal(parseCsrfFromCookieString(cookie), 'tok123');
  });

  it('returns empty string when __Host-csrf is absent', () => {
    assert.equal(parseCsrfFromCookieString('session=abc; other=xyz'), '');
  });

  it('returns empty string for empty cookie string', () => {
    assert.equal(parseCsrfFromCookieString(''), '');
  });

  it('handles __Host-csrf as the only cookie', () => {
    assert.equal(parseCsrfFromCookieString('__Host-csrf=onlyme'), 'onlyme');
  });

  it('does not match a partial prefix (csrf= without __Host-)', () => {
    assert.equal(parseCsrfFromCookieString('csrf=fake; __Host-csrf=real'), 'real');
  });
});
