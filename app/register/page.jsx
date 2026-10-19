'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
    const j = await r.json();
    if (!r.ok) return setErr(j.error || 'Failed');
    router.push('/app');
  }

  return (
    <main className="wrap" style={{ maxWidth: 420, paddingTop: '12vh' }}>
      <h1 style={{ fontSize: 28 }}>🪶 Create account</h1>
      <form onSubmit={submit} className="row" style={{ flexDirection: 'column' }}>
        <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password (6+ chars)" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {err && <div className="muted" style={{ color: '#f87171' }}>{err}</div>}
        <button className="btn" type="submit">Create account</button>
      </form>
      <p className="muted">Already registered? <Link href="/login">Sign in</Link></p>
    </main>
  );
}