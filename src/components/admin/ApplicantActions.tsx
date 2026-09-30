'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { STATUSES, STATUS_LABEL } from '@/lib/schema';

export default function ApplicantActions({ id, status, notes, cohortNote }: { id: number; status: string; notes: string; cohortNote: string }) {
  const [s, setS] = useState(status); const [n, setN] = useState(notes); const [c, setC] = useState(cohortNote); const [msg, setMsg] = useState(''); const r = useRouter();
  async function save() {
    const res = await fetch(`/api/admin/applicants/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: s, adminNotes: n, cohortNote: c }) });
    setMsg(res.ok ? 'Saved' : 'Failed to save'); if (res.ok) r.refresh();
  }
  return (
    <div className="panel">
      <h3>Review</h3>
      <div className="field"><label htmlFor="st">Status</label><select id="st" value={s} onChange={(e) => setS(e.target.value)}>{STATUSES.map((x) => <option key={x} value={x}>{STATUS_LABEL[x]}</option>)}</select></div>
      <div className="field"><label htmlFor="cn">Class / group arrangement (internal)</label><input id="cn" type="text" value={c} onChange={(e) => setC(e.target.value)} maxLength={500} /></div>
      <div className="field"><label htmlFor="nt">Internal notes <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(never shown to applicants)</span></label><textarea id="nt" value={n} onChange={(e) => setN(e.target.value)} maxLength={5000} /></div>
      <button className="btn btn-primary sm" onClick={save}>Save</button> <span role="status" style={{ marginLeft: 10, fontWeight: 700 }}>{msg}</span>
    </div>
  );
}
