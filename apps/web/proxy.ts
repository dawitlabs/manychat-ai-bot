import { NextRequest, NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME } from './src/lib/auth';

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const isValid = token ? await verifySession(token) : false;

  if (!isValid) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/sign-in';
    url.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
