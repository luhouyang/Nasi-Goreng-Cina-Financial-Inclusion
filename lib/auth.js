import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || 'woodpecker-dev-secret');

export const hash = (p) => bcrypt.hash(p, 10);
export const verify = (p, h) => bcrypt.compare(p, h);

export async function sign(uid, email) {
  return new SignJWT({ uid, email }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').sign(secret());
}

export async function who() {
  const token = cookies().get('woodpecker_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

export function setAuthCookie(res, token) {
  res.cookies.set('woodpecker_token', token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
  return res;
}