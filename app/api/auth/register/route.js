import { NextResponse } from 'next/server';
import { db } from '@/lib/mongo';
import { hash, sign, setAuthCookie } from '@/lib/auth';

export async function POST(req) {
  const { name = '', email, password } = await req.json();
  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: 'email + password (6+ chars) required' }, { status: 400 });
  }
  const users = db().collection('users');
  if (await users.findOne({ email })) return NextResponse.json({ error: 'Account already exists' }, { status: 409 });
  const r = await users.insertOne({ name, email, pass: await hash(password), createdAt: new Date() });
  return setAuthCookie(NextResponse.json({ ok: true }), await sign(r.insertedId.toString(), email));
}