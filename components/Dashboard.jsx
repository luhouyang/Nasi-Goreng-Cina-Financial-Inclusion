'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard({ initial }) {
  const [docs] = useState(initial);
  const [idea, setIdea] = useState('');
  const [running, setRunning] = useState(false);
  const router = useRouter();

  async function newFromIdea() {
    if (!idea.trim() || running) return;
    setRunning(true);
    try {
      const c = await fetch('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: idea, blocks: [] }),
      });
      const cj = await c.json();
      router.push(`/app/doc/${cj.id}?run=${encodeURIComponent(idea)}`);
    } catch (e) {
      alert('Failed: ' + e.message);
      setRunning(false);
    }
  }

  return (
    <main className="wrap">
      <h1 style={{ fontSize: 26 }}>Your business documents</h1>
      <div className="card">
        <div className="muted" style={{ marginBottom: 8 }}>Start a new plan — the document builds itself live: summary types in, then charts, frameworks, actions and linked sources drop in as each agent finishes.</div>
        <textarea className="input" rows={3} placeholder="Describe your business idea…" value={idea} onChange={(e) => setIdea(e.target.value)} />
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={newFromIdea} disabled={running} title="Create a document and stream the full agent pipeline into it">
            {running ? <><span className="spin" /> Opening…</> : 'Run agents ▸'}
          </button>
        </div>
      </div>

      {docs.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>No documents yet</h2>
          <p className="muted">Create your first business plan using the form above</p>
        </div>
      )}

      {docs.map((d) => (
        <div key={d._id} className="card" style={{ cursor: 'pointer' }} title="Open document" onClick={() => router.push('/app/doc/' + d._id)}>
          <strong>{d.title}</strong>
          <div className="muted">Updated {(d.updatedAt ? new Date(d.updatedAt).toISOString().slice(0, 10) : '')}</div>
        </div>
      ))}
    </main>
  );
}