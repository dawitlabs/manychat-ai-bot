import { NextRequest, NextResponse } from 'next/server';
import { scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { signSession, COOKIE_NAME, MAX_AGE } from '@/lib/auth';
import sql from '@/lib/db';

const scryptAsync = promisify(scrypt);

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  return derived.toString('hex') === hash;
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const rows = await sql<{ password_hash: string }[]>`
    SELECT password_hash FROM admins WHERE email = ${email} LIMIT 1
  `;

  if (rows.length === 0 || !(await verifyPassword(password, rows[0].password_hash))) {
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
