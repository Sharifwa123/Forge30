'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const r = useRouter();
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) }).catch(() => null);
    if (res?.ok) { r.replace('/admin'); r.refresh(); return; }
    setErr((await res?.json().catch(() => null))?.error || 'Could not sign in.'); setBusy(false);
  }
  return (
    <form onSubmit={go} noValidate className="form-card" style={{ width: 'min(100%,420px)', transform: 'none' }}>
      <h1 style={{ fontSize: '1.6rem' }}>FORGE30 admin</h1>
      <div className={'field' + (err ? ' invalid' : '')}><label htmlFor="pw">Password</label><input id="pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required />{err && <div className="error" role="alert">⚠ {err}</div>}</div>
      <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy || !pw}>{busy ? 'SIGNING IN…' : 'SIGN IN'}</button>
    </form>
  );
}
