import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'woodpecker-dev-secret');

export async function middleware(req) {
  const token = req.cookies.get('woodpecker_token')?.value;
  const path = req.nextUrl.pathname;
  let ok = false;
  if (token) {
    try { await jwtVerify(token, SECRET); ok = true; } catch {}
  }
  if (path.startsWith('/app') && !ok) return NextResponse.redirect(new URL('/login', req.url));
  if ((path === '/login' || path === '/register') && ok) return NextResponse.redirect(new URL('/app', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/app/:path*', '/login', '/register'] };