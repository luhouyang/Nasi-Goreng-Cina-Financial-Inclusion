import { NextResponse } from 'next/server';
import { db } from '@/lib/mongo';
import { who } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

async function owned(id) {
  const user = await who();
  if (!user) return null;
  return db().collection('documents').findOne({ _id: new ObjectId(id), userId: user.uid });
}

export async function GET(req, { params }) {
  const doc = await owned(params.id);
  if (!doc) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ doc });
}

export async function PATCH(req, { params }) {
  const doc = await owned(params.id);
  if (!doc) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const { title, blocks } = await req.json();
  await db().collection('documents').updateOne({ _id: doc._id }, { $set: { title, blocks, updatedAt: new Date() } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const doc = await owned(params.id);
  if (!doc) return NextResponse.json({ error: 'not found' }, { status: 404 });
  await db().collection('documents').deleteOne({ _id: doc._id });
  return NextResponse.json({ ok: true });
}