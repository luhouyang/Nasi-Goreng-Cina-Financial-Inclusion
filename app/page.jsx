import Link from 'next/link';
import { who } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await who();
  return (
    <main className="wrap" style={{ textAlign: 'center', paddingTop: '14vh' }}>
      <h1 style={{ fontSize: 44, letterSpacing: '-0.03em', margin: 0 }}>🪶 Woodpecker</h1>
      <p className="muted" style={{ fontSize: 18 }}>Prompt your way to business success. You ideate, we do the thing.</p>
      <div className="row" style={{ justifyContent: 'center', marginTop: 24 }}>
        {user ? (
          <Link href="/app" className="btn">Open dashboard</Link>
        ) : (
          <>
            <Link href="/register" className="btn">Create account</Link>
            <Link href="/login" className="btn ghost">Sign in</Link>
          </>
        )}
      </div>
    </main>
  );
}