import { NextResponse } from 'next/server';

function clear(res) {
  res.cookies.set('woodpecker_token', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}

export async function POST() {
  return clear(NextResponse.redirect(new URL('/login', 'http://localhost:3000')));
}

export async function GET() {
  return clear(NextResponse.redirect(new URL('/login', 'http://localhost:3000')));
}