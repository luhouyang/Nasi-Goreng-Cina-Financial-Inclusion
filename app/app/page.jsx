import { who } from '@/lib/auth';
import { db } from '@/lib/mongo';
import Dashboard from '@/components/Dashboard';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await who();
  if (!user) return <Dashboard initial={[]} />;
  const docs = await db()
    .collection('documents')
    .find({ userId: user.uid })
    .project({ blocks: 0 })
    .sort({ updatedAt: -1 })
    .toArray();
  return <Dashboard initial={JSON.parse(JSON.stringify(docs))} />;
}