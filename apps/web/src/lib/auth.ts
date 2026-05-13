export const COOKIE_NAME = 'kyle-ai-session';
export const MAX_AGE = 60 * 60 * 24 * 7;

function getSecret(): string {
  return process.env.AUTH_SECRET ?? 'fallback-dev-secret-change-in-production';
}

async function hmac(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Buffer.from(sig).toString('base64url');
}

export async function signSession(): Promise<string> {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + MAX_AGE * 1000 })).toString('base64url');
  const sig = await hmac(payload, getSecret());
  return `${payload}.${sig}`;
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return false;
    const expected = await hmac(payload, getSecret());
    if (expected !== sig) return false;
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return Date.now() < exp;
  } catch {
    return false;
  }
}
