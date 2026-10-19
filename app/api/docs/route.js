import { NextResponse } from 'next/server';
import { db } from '@/lib/mongo';
import { who } from '@/lib/auth';
import { uid } from '@/lib/blocks';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await who();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const docs = await db().collection('documents').find({ userId: user.uid }).project({ blocks: 0 }).sort({ updatedAt: -1 }).toArray();
  return NextResponse.json({ docs });
}

export async function POST(req) {
  const user = await who();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { title = 'Untitled', blocks = [{ id: uid(), type: 'paragraph', text: '' }] } = await req.json();
  const r = await db().collection('documents').insertOne({ userId: user.uid, title, blocks, createdAt: new Date(), updatedAt: new Date() });
  return NextResponse.json({ id: r.insertedId.toString() });
}