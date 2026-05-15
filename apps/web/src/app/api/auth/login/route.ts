import { NextRequest, NextResponse } from 'next/server';
import { signSession, COOKIE_NAME, MAX_AGE } from '@/lib/auth';

const API_URL = process.env.API_URL ?? 'https://kyle-api.onrender.com';

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const upstream = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (err) {
    console.error('Auth upstream error:', err);
    return NextResponse.json({ error: 'Could not reach auth server' }, { status: 502 });
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
