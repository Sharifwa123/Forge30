'use client';
import { useState } from 'react';
import { track } from '@/lib/track';
import { waLink } from '@/lib/whatsapp';

/** "Chat with us on WhatsApp" button. Renders nothing until an organizer WhatsApp number is set in the admin. */
export function WhatsAppChat({ number, className = 'btn btn-ghost', label = 'CHAT WITH US ON WHATSAPP' }: { number: string; className?: string; label?: string }) {
  if (!number) return null;
  return <a className={className} href={waLink(number, 'Hello, I would like to know more about FORGE30 by SHARIF TECHNOLOGIES.')} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_clicked')}>{label}</a>;
}

/** Name + WhatsApp number only: a 20-second way to raise a hand before the full application. */
export default function InterestForm({ open }: { open: boolean }) {
  const [name, setName] = useState(''); const [num, setNum] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { groupUrl: string }>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = await fetch('/api/interest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, whatsapp: num }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setErr(j.error || 'Could not save. Please try again.'); else { setDone({ groupUrl: j.groupUrl || '' }); track('interest_submitted'); }
    } catch { setErr('No connection. Please check your internet and try again.'); }
    setBusy(false);
  }
  if (done) return (
    <div className="int-done" role="status">
      <h3>Thank you, {name.split(' ')[0]}! 🎉</h3>
      <p>We have your number and will message you on WhatsApp with the details.</p>
      <div className="cta-row">
        {done.groupUrl && <a className="btn btn-amber" href={done.groupUrl} target="_blank" rel="noopener noreferrer">JOIN THE WHATSAPP GROUP</a>}
        {open && <a className="btn btn-line" href="/apply">START MY APPLICATION</a>}
      </div>
    </div>
  );
  return (
    <form className="int-form" onSubmit={submit} noValidate>
      <div className="int-fields">
        <div className="field"><label htmlFor="int-name">Your name</label><input id="int-name" type="text" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field"><label htmlFor="int-wa">WhatsApp number</label><input id="int-wa" type="tel" inputMode="tel" autoComplete="tel" placeholder="e.g. 024 123 4567" maxLength={20} value={num} onChange={(e) => setNum(e.target.value)} /></div>
      </div>
      {err && <div className="error" role="alert">⚠ {err}</div>}
      <button className="btn btn-amber" disabled={busy}>{busy ? 'SENDING…' : 'KEEP ME UPDATED'} <span className="arrow">→</span></button>
      <p className="note" style={{ marginTop: 10 }}>Only used to message you about FORGE30. Not an application.</p>
    </form>
  );
}
