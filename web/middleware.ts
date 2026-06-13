import { NextRequest, NextResponse } from 'next/server';

const PUBLIC = ['/login', '/_next', '/favicon', '/porsche-logo', '/cars', '/hero-track'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next();
  const token = req.cookies.get('auth');
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!api).*)'] };
