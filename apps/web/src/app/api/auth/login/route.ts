import { NextRequest, NextResponse } from 'next/server';
import { signSession, COOKIE_NAME, MAX_AGE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
  const upstream = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await signSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
  return res;
}
