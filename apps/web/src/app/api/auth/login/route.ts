import { NextRequest, NextResponse } from 'next/server';
import { scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import postgres from 'postgres';
import { signSession, COOKIE_NAME, MAX_AGE } from '@/lib/auth';

const scryptAsync = promisify(scrypt);

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  const hashBuf = Buffer.from(hash, 'hex');
  if (derived.length !== hashBuf.length) return false;
  return timingSafeEqual(derived, hashBuf);
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const sql = postgres(process.env.DATABASE_URL!);
  try {
    const rows = await sql`SELECT password_hash FROM admins WHERE email = ${email} LIMIT 1`;
    if (rows.length === 0 || !(await verifyPassword(password, rows[0].password_hash))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } finally {
    await sql.end();
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
