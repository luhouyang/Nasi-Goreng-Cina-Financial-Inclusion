import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="wrap" style={{ textAlign: 'center', paddingTop: '20vh' }}>
      <h1 style={{ fontSize: 64, margin: 0, color: '#7c3aed' }}>404</h1>
      <p className="muted" style={{ fontSize: 18, margin: '12px 0 24px' }}>Page not found</p>
      <Link href="/" className="btn">Back to home</Link>
    </main>
  );
}