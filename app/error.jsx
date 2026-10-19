'use client';

export default function Error({ error, reset }) {
  return (
    <main className="wrap" style={{ textAlign: 'center', paddingTop: '20vh' }}>
      <h1 style={{ fontSize: 28, color: '#f87171' }}>Something went wrong</h1>
      <p className="muted" style={{ margin: '12px 0 24px' }}>{error?.message || 'Unexpected error'}</p>
      <button className="btn" onClick={() => reset()}>Try again</button>
    </main>
  );
}