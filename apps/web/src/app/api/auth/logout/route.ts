import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const apiUrl = process.env.API_URL ?? '';
  const apiAdminKey = process.env.API_ADMIN_KEY ?? '';
  const token = req.cookies.get(COOKIE_NAME)?.value;

  // Best-effort revocation: bump token_version so the JWT is invalidated server-side
  if (token && apiUrl && apiAdminKey) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as Record<string, unknown>;
        const sub = typeof payload.sub === 'string' ? payload.sub : null;
        if (sub) {
          await fetch(`${apiUrl}/auth/revoke`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-key': apiAdminKey },
            body: JSON.stringify({ email: sub }),
          });
        }
      }
    } catch {
      // Non-fatal — still clear the cookie
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
  res.cookies.set('__Host-csrf', '', { maxAge: 0, path: '/' });
  return res;
}
