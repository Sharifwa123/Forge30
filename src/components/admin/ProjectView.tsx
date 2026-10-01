'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SECTIONS, summarize, type Project } from '@/lib/project';

export default function ProjectView({ project, legacy, id }: { project: Project; legacy?: Record<string, string>; id: number }) {
  const r = useRouter(); const [t, setT] = useState(''); const [msg, setMsg] = useState('');
  const sum = summarize(project);
  async function send(body: object) { const res = await fetch('/api/admin/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...body }) }); setMsg(res.ok ? 'Saved' : 'Failed'); if (res.ok) { setT(''); r.refresh(); } }
  return (
    <div className="panel">
      <h3>Project workspace</h3>
      <p style={{ margin: '0 0 10px' }}><b>{project.title || 'Untitled'}</b> · {sum.ready}/{sum.total} sections ready · {project.log?.length ?? 0} journal entries</p>
      {SECTIONS.map((s) => { const x = project.sections?.[s.key]; return (
        <div className="kv" key={s.key}><dt>{s.title} {x ? (x.ready ? '· ready' : '· draft') : '· not started'}</dt><dd>{x?.text || '—'}</dd></div>
      ); })}
      {legacy && Object.keys(legacy).length > 0 && <details><summary>Project idea from the original application</summary>{Object.entries(legacy).map(([k, v]) => <div className="kv" key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>)}</details>}
      {(project.log?.length ?? 0) > 0 && <details style={{ marginTop: 10 }}><summary>Journal ({project.log!.length})</summary>{project.log!.map((e) => <div className="kv" key={e.id}><dt>{new Date(e.at).toLocaleDateString('en-GB')}</dt><dd>{e.text}</dd></div>)}</details>}
      <h3 style={{ marginTop: 18 }}>Feedback to the student</h3>
      <p className="note">Visible to the student on their project page.</p>
      <label htmlFor="fb" className="sr-only">Feedback</label>
      <textarea id="fb" value={t} maxLength={1500} onChange={(e) => setT(e.target.value)} style={{ minHeight: 90 }} />
      <button className="btn btn-primary sm" style={{ marginTop: 8 }} disabled={t.trim().length < 2} onClick={() => send({ text: t })}>Send feedback</button> <span role="status" style={{ marginLeft: 8, fontWeight: 700 }}>{msg}</span>
      {(project.feedback ?? []).map((f) => <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderTop: '1px solid var(--line)', marginTop: 8 }}><span><small>{new Date(f.at).toLocaleDateString('en-GB')}</small><br />{f.text}</span><button className="btn btn-line sm" onClick={() => send({ remove: f.id })}>Remove</button></div>)}
    </div>
  );
}
