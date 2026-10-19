import { who } from '@/lib/auth';
import { db } from '@/lib/mongo';
import { ObjectId } from 'mongodb';
import { notFound } from 'next/navigation';
import Editor from '@/components/Editor';

export const dynamic = 'force-dynamic';

export default async function Page({ params }) {
  const user = await who();
  if (!user) notFound();
  const doc = await db().collection('documents').findOne({ _id: new ObjectId(params.id), userId: user.uid });
  if (!doc) notFound();
  return <Editor doc={JSON.parse(JSON.stringify(doc))} />;
}