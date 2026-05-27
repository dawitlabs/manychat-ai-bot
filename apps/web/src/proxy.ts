import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifySession } from '@/lib/auth';

export async function proxy(req: NextRequest) {
  const API_URL = process.env.API_URL ?? '';
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.redirect(new URL('/auth/sign-in', req.url));

  // Fast local check: signature + alg + sub + exp
  if (!(await verifySession(token))) {
    return NextResponse.redirect(new URL('/auth/sign-in', req.url));
  }

  // If the token carries a tv (token_version) field, verify it against the API
  // to enforce server-side revocation. Fail open if the API is unreachable —
  // the signature check above already validated authenticity.
  const parts = token.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as Record<string, unknown>;
      if (typeof payload.tv === 'number') {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3_000);
        try {
          const res = await fetch(`${API_URL}/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            signal: controller.signal,
          });
          const data = await res.json() as { valid?: boolean };
          if (!data.valid) return NextResponse.redirect(new URL('/auth/sign-in', req.url));
        } finally {
          clearTimeout(timer);
        }
      }
    } catch {
      // API unreachable — local signature check already passed, allow through
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
