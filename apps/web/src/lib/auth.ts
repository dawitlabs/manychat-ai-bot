export const COOKIE_NAME = 'kyle-ai-session';
export const MAX_AGE = 60 * 60 * 24 * 7;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return secret;
}

async function verifyJwt(token: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [header, payload, sig] = parts;

    const { alg, typ } = JSON.parse(Buffer.from(header, 'base64url').toString()) as Record<string, unknown>;
    if (alg !== 'HS256' || typ !== 'JWT') return false;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(getJwtSecret()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const sigBytes = Buffer.from(sig, 'base64url');
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(`${header}.${payload}`));
    if (!valid) return false;

    const { exp, sub } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Record<string, unknown>;
    if (typeof sub !== 'string' || !sub) return false;
    return typeof exp === 'number' && Date.now() / 1000 < exp;
  } catch {
    return false;
  }
}

export async function verifySession(token: string): Promise<boolean> {
  return verifyJwt(token);
}
