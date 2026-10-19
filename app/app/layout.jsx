import { who } from '@/lib/auth';
import ThemeToggle from '@/components/ThemeToggle';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }) {
  const user = await who();
  return (
    <div>
      <div className="topbar">
        <span className="logo">🪶 Woodpecker</span>
        <div className="row">
          <span className="muted">{user?.email || 'Guest'}</span>
          <ThemeToggle />
          <form action="/api/auth/logout" method="post">
            <button className="btn ghost mini" type="submit" title="Sign out of Woodpecker">Sign out</button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}