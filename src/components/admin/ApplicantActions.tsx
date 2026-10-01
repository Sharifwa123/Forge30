'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { STATUSES, STATUS_LABEL } from '@/lib/schema';

export default function ApplicantActions({ id, status, notes, cohortNote, seat, group, session, studentId, serial, hasPhoto, photoUsed, photoAllowed }: { id: number; status: string; notes: string; cohortNote: string; seat: string; group: string; session: string; studentId: string | null; serial: string | null; hasPhoto: boolean; photoUsed: number; photoAllowed: number }) {
  const [s, setS] = useState(status); const [n, setN] = useState(notes); const [c, setC] = useState(cohortNote); const [st, setSt] = useState(seat); const [g, setG] = useState(group); const [se, setSe] = useState(session); const [msg, setMsg] = useState(''); const r = useRouter();
  async function save() {
    const res = await fetch(`/api/admin/applicants/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: s, adminNotes: n, cohortNote: c, seat: st, groupLabel: g, sessionTime: se }) });
    setMsg(res.ok ? 'Saved' : 'Failed to save'); if (res.ok) r.refresh();
  }
  return (
    <div className="panel">
      <h3>Review</h3>
      <div className="field"><label htmlFor="st">Status</label><select id="st" value={s} onChange={(e) => setS(e.target.value)}>{STATUSES.map((x) => <option key={x} value={x}>{STATUS_LABEL[x]}</option>)}</select></div>
      <div className="info blue"><b>Student card</b><p style={{ margin: 0 }}>{studentId ? <>ID <b>{studentId}</b> · Serial <b>{serial}</b> · Photo: <b>{hasPhoto ? 'uploaded' : 'not yet'}</b></> : 'The student ID and serial are issued automatically when you set the status to Confirmed. Seat, group and class time below appear on the student’s card and dashboard.'}</p>{hasPhoto && <><a href={`/api/admin/photo/${id}`} target="_blank" rel="noopener noreferrer">View photo</a><p style={{ margin: '8px 0 0' }}>Photo changes used: <b>{photoUsed}</b> of <b>{1 + photoAllowed}</b>{photoUsed >= 1 + photoAllowed ? ' (locked)' : ''}</p><button type="button" className="btn btn-line sm" style={{ marginTop: 8 }} onClick={async () => { const doc = prompt('Only unlock after the student shows a legal document or card with their photo.\nWhich document did you verify? (e.g. Ghana Card)'); if (!doc) return; const res = await fetch('/api/admin/photo-unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, idChecked: doc }) }); setMsg(res.ok ? 'Photo change unlocked' : 'Failed'); if (res.ok) r.refresh(); }}>ID verified — allow one more photo change</button></>}</div>
      <div className="grid g2"><div className="field"><label htmlFor="seat">Seat number</label><input id="seat" type="text" maxLength={20} value={st} onChange={(e) => setSt(e.target.value)} placeholder="e.g. B-14 (if applicable)" /></div><div className="field"><label htmlFor="grp">Group</label><input id="grp" type="text" maxLength={40} value={g} onChange={(e) => setG(e.target.value)} placeholder="e.g. Group A" /></div></div>
      <div className="field"><label htmlFor="ses">Class time shown to the student</label><input id="ses" type="text" maxLength={60} value={se} onChange={(e) => setSe(e.target.value)} placeholder="e.g. 6:00–8:00 PM daily" /></div>
      <div className="field"><label htmlFor="cn">Internal class arrangement note</label><input id="cn" type="text" value={c} onChange={(e) => setC(e.target.value)} maxLength={500} /></div>
      <div className="field"><label htmlFor="nt">Internal notes <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(never shown to applicants)</span></label><textarea id="nt" value={n} onChange={(e) => setN(e.target.value)} maxLength={5000} /></div>
      <button className="btn btn-primary sm" onClick={save}>Save</button> <span role="status" style={{ marginLeft: 10, fontWeight: 700 }}>{msg}</span>
    </div>
  );
}
