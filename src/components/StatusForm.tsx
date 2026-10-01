'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const MSG: Record<string, string> = {
  submitted: 'Your application has been received and is waiting to be reviewed.',
  under_review: 'Your application is being reviewed.',
  selected: 'You have been selected. SHARIF TECHNOLOGIES will contact you with next steps. Your class time and delivery arrangement will be communicated by the organizer.',
  not_selected: 'Thank you for applying. You were not selected for this cohort.',
  confirmed: 'Your place is confirmed. SHARIF TECHNOLOGIES will share your class arrangement.',
  withdrawn: 'This application has been withdrawn.',
};

export default function StatusForm() {
  const [ref, setRef] = useState(''); const [email, setEmail] = useState('');
  const router = useRouter(); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [res, setRes] = useState<{ status: string; label: string } | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(''); setRes(null);
    try {
      const r = await fetch('/api/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ref, email }) });
      const j = await r.json();
      if (!r.ok) setErr(j.error || 'Could not check status.'); else { setRes(j); router.push('/dashboard'); return; }
    } catch { setErr('Network problem. Check your connection and try again.'); }
    setBusy(false);
  }
  return (
    <form onSubmit={submit} className="form-card" style={{ transform: 'none' }} noValidate>
      <div className={'field' + (err ? ' invalid' : '')}><label htmlFor="ref">Reference code</label><input id="ref" type="text" autoCapitalize="characters" autoComplete="off" placeholder="F30-XXXXXXXX" value={ref} onChange={(e) => setRef(e.target.value)} required /></div>
      <div className="field"><label htmlFor="em">Email address</label><input id="em" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      {err && <div className="error" role="alert">⚠ {err}</div>}
      <button className="btn btn-primary" disabled={busy || !ref || !email} style={{ width: '100%', marginTop: 12 }}>{busy ? 'OPENING…' : 'OPEN MY DASHBOARD'}</button>
      {res && <div className="info blue" style={{ marginTop: 22, marginBottom: 0 }} role="status"><b>Status: {res.label}</b><p>{MSG[res.status]}</p></div>}
    </form>
  );
}
