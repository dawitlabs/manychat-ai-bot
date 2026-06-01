import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, COOKIE_NAME, MAX_AGE } from '@/lib/auth';

const TWO_DAYS_S = 60 * 60 * 24 * 2;

function getApiUrl(): string {
  const url = process.env.API_URL;
  if (!url) throw new Error('API_URL environment variable is required');
  return url;
}

function getApiAdminKey(): string {
  const key = process.env.API_ADMIN_KEY;
  if (!key) throw new Error('API_ADMIN_KEY environment variable is required');
  return key;
}

function csrfError() {
  return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
}

async function proxy(req: NextRequest, path: string) {
  const API_URL = getApiUrl();
  const API_ADMIN_KEY = getApiAdminKey();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token || !(await verifySession(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // CSRF double-submit check on state-changing methods
  const method = req.method.toUpperCase();
  if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
    const csrfHeader = req.headers.get('x-csrf-token');
    const csrfCookie = cookieStore.get('__Host-csrf')?.value;
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      return csrfError();
    }
  }

  const url = `${API_URL}/${path}${req.nextUrl.search}`;
  const body = method !== 'GET' && method !== 'HEAD' ? await req.text() : undefined;

  const upstream = await fetch(url, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': API_ADMIN_KEY,
    },
    body,
  });
  const data = await upstream.text();
  const response = new NextResponse(data, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  });

  // Transparent token refresh: if the JWT is < 48h from expiry, fetch a new one
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as Record<string, unknown>;
      if (typeof payload.exp === 'number' && payload.exp - Date.now() / 1000 < TWO_DAYS_S) {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json() as { token?: string };
          if (refreshData.token) {
            response.cookies.set(COOKIE_NAME, refreshData.token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: MAX_AGE,
              path: '/',
            });
          }
        }
      }
    }
  } catch {
    // Refresh is best-effort; never fail the proxied request over it
  }

  return response;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path.join('/'));
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path.join('/'));
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path.join('/'));
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path.join('/'));
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path.join('/'));
}
