'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDialog } from '../Dialog';
import { STATUSES, STATUS_LABEL } from '@/lib/schema';

type Row = { id: number; ref: string; name: string; email: string; phone: string; location: string; status: string; created: string; format: string; computer: string; periods: string; contrib: string; commit: string; place: string };

export default function ApplicantTable({ rows }: { rows: Row[] }) {
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState('under_review');
  const [msg, setMsg] = useState('');
  const r = useRouter(); const { ask, confirm } = useDialog(); const [grp, setGrp] = useState(''); const [ses, setSes] = useState(''); const [pre, setPre] = useState(''); const [start, setStart] = useState('');
  async function send(body: object, ok: string) {
    const res = await fetch('/api/admin/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [...sel], ...body }) });
    const j = await res.json().catch(() => ({})); setMsg(res.ok ? `${ok} (${j.updated})` : j.error || 'Failed'); if (res.ok) { setSel(new Set()); r.refresh(); }
  }
  const all = rows.length > 0 && sel.size === rows.length;
  const toggle = (id: number) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  async function bulk() {
    const res = await fetch('/api/admin/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [...sel], status }) });
    const j = await res.json().catch(() => ({}));
    setMsg(res.ok ? `Updated ${j.updated} applicants` : j.error || 'Failed'); if (res.ok) { setSel(new Set()); r.refresh(); }
  }
  return (
    <>
      {sel.size > 0 && (
        <div className="panel" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12, padding: 12 }} role="region" aria-label="Bulk actions">
          <b>{sel.size} selected</b>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="New status" style={{ minHeight: 40, padding: '0 10px' }}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
          <button className="btn btn-primary sm" onClick={bulk}>Set status</button>
          <button className="btn btn-line sm" onClick={() => setSel(new Set())}>Clear selection</button>
          <a className="btn btn-line sm" href={`/api/admin/export?ids=${[...sel].join(',')}`}>Export selected</a>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', flexBasis: '100%' }}>
            <input aria-label="Group" placeholder="Group" value={grp} onChange={(e) => setGrp(e.target.value)} style={{ minHeight: 40, width: 110 }} />
            <input aria-label="Class time" placeholder="Class time" value={ses} onChange={(e) => setSes(e.target.value)} style={{ minHeight: 40, width: 150 }} />
            <input aria-label="Seat prefix" placeholder="Seat prefix" value={pre} onChange={(e) => setPre(e.target.value)} style={{ minHeight: 40, width: 100 }} />
            <input aria-label="First seat number" placeholder="First seat no." inputMode="numeric" value={start} onChange={(e) => setStart(e.target.value.replace(/\D/g, ''))} style={{ minHeight: 40, width: 110 }} />
            <button className="btn btn-line sm" disabled={!grp && !ses && !start} onClick={() => send({ assign: { ...(grp ? { group: grp } : {}), ...(ses ? { session: ses } : {}), ...(start ? { seatStart: Number(start), seatPrefix: pre } : {}) } }, 'Assigned')}>Assign group / time / seats</button>
            <button className="btn btn-line sm" onClick={async () => { const m = await ask({ title: `Message ${sel.size} student(s)`, body: <p>Shown as a highlighted notice in each selected student’s dashboard. Leave replacement text to overwrite any earlier message.</p>, label: 'Message', placeholder: 'Your message', minLength: 2, confirmLabel: 'Send message' }); if (m) send({ message: m }, 'Message set'); }}>Message</button>
            <button className="btn btn-danger sm" onClick={async () => { if (!(await confirm({ title: `Delete ${sel.size} applicant(s)?`, body: <p>Their applications, projects and cards are permanently removed. This cannot be undone.</p>, confirmLabel: 'Delete permanently', tone: 'danger' }))) return; send({ delete: true }, 'Deleted'); }}>Delete</button>
          </div>
        </div>
      )}
      <div style={{ marginBottom: 12 }}><button className="btn btn-line sm" onClick={async () => { const res = await fetch('/api/admin/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [1], autoPlace: true }) }); const j = await res.json().catch(() => ({})); setMsg(res.ok ? `Placed ${j.updated} unplaced applicant(s)` : 'Failed'); if (res.ok) r.refresh(); }}>Auto-place unplaced applicants</button></div>
      {msg && <div className="info blue" role="status">{msg}</div>}
      <div className="tbl-wrap">
        <table>
          <thead><tr><th><input type="checkbox" checked={all} aria-label="Select all" onChange={() => setSel(all ? new Set() : new Set(rows.map((x) => x.id)))} /></th><th>Applicant</th><th>Location</th><th>Status</th><th>Placement</th><th>Format</th><th>Computer</th><th>Availability</th><th>Contribution</th><th>Seriousness</th><th>Date</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={11} style={{ padding: 28, textAlign: 'center' }}>No applicants match.</td></tr>}
            {rows.map((x) => (
              <tr key={x.id}>
                <td><input type="checkbox" checked={sel.has(x.id)} onChange={() => toggle(x.id)} aria-label={`Select ${x.name}`} /></td>
                <td><Link href={`/admin/applicants/${x.id}`}><b>{x.name}</b></Link><div style={{ color: 'var(--muted)', fontSize: 13 }}>{x.ref} · {x.phone}</div></td>
                <td>{x.location}</td><td><span className={'pill ' + x.status}>{STATUS_LABEL[x.status as keyof typeof STATUS_LABEL]}</span></td>
                <td style={{ fontSize: 13 }}>{x.place}</td><td>{x.format}</td><td>{x.computer}</td><td>{x.periods}</td><td>{x.contrib}</td><td style={{ fontSize: 13 }}>{x.commit}</td><td>{x.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
