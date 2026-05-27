import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, MAX_AGE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const apiUrl = process.env.API_URL ?? '';
  const body = await req.json();

  let token: string;
  try {
    const upstream = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const data = await upstream.json() as { token?: string };
    if (!data.token) {
      return NextResponse.json({ error: 'Auth server did not return a token' }, { status: 502 });
    }
    token = data.token;
  } catch (err) {
    console.error('Auth upstream error:', err);
    return NextResponse.json({ error: 'Could not reach auth server' }, { status: 502 });
  }

  const csrfToken = crypto.randomUUID();
  const res = NextResponse.json({ ok: true, csrfToken });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: MAX_AGE,
    path: '/',
  });
  // CSRF double-submit cookie: readable by JS so the client can echo it in the header
  res.cookies.set('__Host-csrf', csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: MAX_AGE,
    path: '/',
  });
  return res;
}
