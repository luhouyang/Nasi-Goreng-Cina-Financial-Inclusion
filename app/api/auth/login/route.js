import { NextResponse } from 'next/server';
import { db } from '@/lib/mongo';
import { verify, sign, setAuthCookie } from '@/lib/auth';

export async function POST(req) {
  const { email, password } = await req.json();
  const user = await db().collection('users').findOne({ email });
  if (!user || !(await verify(password, user.pass))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  return setAuthCookie(NextResponse.json({ ok: true }), await sign(user._id.toString(), email));
}