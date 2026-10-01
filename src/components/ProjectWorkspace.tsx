'use client';
import { useEffect, useRef, useState } from 'react';
import { SECTIONS, STAGES, summarize, type Project } from '@/lib/project';

type Save = 'idle' | 'saving' | 'saved' | 'error';
const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

async function post(body: object) {
  const r = await fetch('/api/student/project', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Could not save.');
  return j;
}

export default function ProjectWorkspace({ name, initial }: { name: string; initial: Project }) {
  const [p, setP] = useState<Project>(initial);
  const [tab, setTab] = useState<'build' | 'journal' | 'proposal'>('build');
  const [open, setOpen] = useState<string | null>(() => SECTIONS.find((s) => !initial.sections?.[s.key]?.ready)?.key ?? null);
  const sum = summarize(p);
  const pct = Math.round((sum.ready / sum.total) * 100);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="no-print">
        <div className="eyebrow">My project</div>
        <h1 style={{ fontSize: 'clamp(1.8rem,5.5vw,2.8rem)', marginBottom: 6 }}>Build your project, one piece at a time.</h1>
        <p className="lead" style={{ marginBottom: 0 }}>Work on this a little at a time between sessions. It saves automatically. By Day 30 it becomes your proposal and the backbone of your presentation.</p>
      </div>

      <section className="panel no-print" style={{ background: 'var(--navy-900)', color: '#fff', borderColor: 'var(--navy-900)' }} aria-label="Progress">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <div style={{ fontSize: 'clamp(1.6rem,5vw,2.4rem)', fontWeight: 800 }}>{sum.ready}<span style={{ color: '#9db5e8', fontSize: '1rem', fontWeight: 600 }}> of {sum.total} sections ready</span></div>
          <div style={{ color: '#c5d3f2' }}>{sum.nextTitle ? <>Next up: <b style={{ color: '#fff' }}>{sum.nextTitle}</b></> : 'Every section is ready. Polish it and prepare to present.'}</div>
        </div>
        <div className="progress-bar" style={{ marginBottom: 0 }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Project completion"><i style={{ width: `${pct}%` }} /></div>
      </section>

      {(p.feedback?.length ?? 0) > 0 && (
        <section className="panel no-print" aria-label="Feedback from SHARIF TECHNOLOGIES" style={{ borderLeft: '6px solid var(--amber)' }}>
          <h2 style={{ fontSize: '1.2rem' }}>Feedback from your instructor</h2>
          {p.feedback!.map((f) => <div key={f.id} style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}><div style={{ fontSize: '.8rem', color: 'var(--muted)', fontWeight: 700 }}>{fmt(f.at)}</div><div style={{ whiteSpace: 'pre-wrap' }}>{f.text}</div></div>)}
        </section>
      )}

      <div className="chips no-print" role="tablist" aria-label="Project workspace">
        {([['build', 'Build'], ['journal', `Progress journal${p.log?.length ? ` (${p.log.length})` : ''}`], ['proposal', 'Proposal']] as const).map(([k, l]) => <button key={k} role="tab" className="chip" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {tab === 'build' && <Build p={p} setP={setP} open={open} setOpen={setOpen} />}
      {tab === 'journal' && <Journal p={p} setP={setP} />}
      {tab === 'proposal' && <Proposal p={p} name={name} />}
    </div>
  );
}

function Build({ p, setP, open, setOpen }: { p: Project; setP: (f: (x: Project) => Project) => void; open: string | null; setOpen: (k: string | null) => void }) {
  const [title, setTitle] = useState(p.title ?? ''); const [ts, setTs] = useState<Save>('idle');
  async function saveTitle() { if ((p.title ?? '') === title) return; setTs('saving'); try { await post({ kind: 'title', title }); setP((x) => ({ ...x, title })); setTs('saved'); } catch { setTs('error'); } }
  return (
    <div style={{ display: 'grid', gap: 18 }} className="no-print">
      <div className="panel">
        <label htmlFor="ptitle" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Project name <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(a working name is fine, you can change it)</span></label>
        <input id="ptitle" type="text" maxLength={120} value={title} onChange={(e) => { setTitle(e.target.value); setTs('idle'); }} onBlur={saveTitle} />
        <SaveNote s={ts} />
      </div>
      {STAGES.map((st) => (
        <div key={st.id} role="group" aria-label={st.name}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', margin: '6px 0 4px' }}>
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}><span style={{ color: 'var(--brand)' }}>Stage {st.id}.</span> {st.name}</h2>
            <span style={{ fontSize: '.78rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>{st.pace}</span>
          </div>
          <p style={{ color: 'var(--muted)', margin: '0 0 10px' }}>{st.blurb}</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {SECTIONS.filter((s) => s.stage === st.id).map((s) => <SectionCard key={s.key} s={s} p={p} setP={setP} isOpen={open === s.key} toggle={() => setOpen(open === s.key ? null : s.key)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function SaveNote({ s }: { s: Save }) {
  return <div role="status" aria-live="polite" style={{ minHeight: 22, fontSize: '.85rem', fontWeight: 700, marginTop: 4, color: s === 'error' ? 'var(--err)' : s === 'saved' ? 'var(--ok)' : 'var(--muted)' }}>{s === 'saving' ? 'Saving…' : s === 'saved' ? '✓ Saved' : s === 'error' ? '⚠ Not saved. Check your connection; we will retry when you type again.' : ''}</div>;
}

function SectionCard({ s, p, setP, isOpen, toggle }: { s: (typeof SECTIONS)[number]; p: Project; setP: (f: (x: Project) => Project) => void; isOpen: boolean; toggle: () => void }) {
  const saved = p.sections?.[s.key];
  const [text, setText] = useState(saved?.text ?? ''); const [ready, setReady] = useState(saved?.ready ?? false); const [st, setSt] = useState<Save>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null); const latest = useRef({ text, ready }); latest.current = { text, ready };
  const dirty = useRef(false);

  async function flush() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (!dirty.current) return;
    setSt('saving'); const { text: t, ready: r } = latest.current;
    try { const j = await post({ kind: 'section', key: s.key, text: t, ready: r && t.trim().length > 0 }); dirty.current = false; setP((x) => ({ ...x, sections: { ...x.sections, [s.key]: { text: t.trim(), ready: r && t.trim().length > 0, updatedAt: j.updatedAt } } })); setSt('saved'); }
    catch { setSt('error'); }
  }
  const change = (t: string, r: boolean) => { setText(t); setReady(r); dirty.current = true; setSt('idle'); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(flush, 1200); };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { const h = () => { if (dirty.current) flush(); }; window.addEventListener('pagehide', h); return () => window.removeEventListener('pagehide', h); });

  const len = text.trim().length; const status = saved?.ready ? 'ready' : len > 0 ? 'draft' : 'empty';
  return (
    <div className="panel" style={{ padding: 0, borderColor: isOpen ? 'var(--brand)' : undefined }}>
      <h3 style={{ margin: 0 }}>
        <button onClick={() => { if (isOpen) flush(); toggle(); }} aria-expanded={isOpen} aria-controls={`sec-${s.key}`} style={{ width: '100%', textAlign: 'left', background: 'none', border: 0, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', cursor: 'pointer', font: 'inherit', color: 'inherit', minHeight: 60 }}>
          <span style={{ fontWeight: 700 }}>{s.title}</span>
          <span className={'pill ' + (status === 'ready' ? 'selected' : status === 'draft' ? 'under_review' : '')}>{status === 'ready' ? '✓ Ready' : status === 'draft' ? 'Draft' : 'Not started'}</span>
        </button>
      </h3>
      {isOpen && (
        <div id={`sec-${s.key}`} style={{ padding: '0 18px 18px', animation: 'rise .25s both' }}>
          <p style={{ marginTop: 0 }}>{s.prompt}</p>
          <div className="ex" style={{ marginBottom: 14 }}><b>Example</b>{s.example}</div>
          <label htmlFor={`t-${s.key}`} className="sr-only" style={{ position: 'absolute', left: -9999 }}>{s.title}</label>
          <textarea id={`t-${s.key}`} rows={6} maxLength={4000} value={text} onChange={(e) => change(e.target.value, ready)} onBlur={flush} placeholder="Write in your own words. A rough draft is fine." />
          <div className="count">{len}/4000{len > 0 && len < s.min ? ` · aim for at least ${s.min} characters` : ''}</div>
          <label className="opt cb" style={{ marginTop: 10 }}>
            <input type="checkbox" checked={ready} disabled={len === 0} onChange={(e) => change(text, e.target.checked)} /><span className="mk" aria-hidden /><span><b>Mark this section as ready</b><br /><span style={{ color: 'var(--muted)', fontSize: '.9rem' }}>You can still edit it later.</span></span>
          </label>
          <SaveNote s={st} />
        </div>
      )}
    </div>
  );
}

function Journal({ p, setP }: { p: Project; setP: (f: (x: Project) => Project) => void }) {
  const [t, setT] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function add() { setBusy(true); setErr(''); try { const j = await post({ kind: 'log.add', text: t }); setP((x) => ({ ...x, log: j.log })); setT(''); } catch (e: any) { setErr(e.message); } setBusy(false); }
  async function remove(id: string) { if (!confirm('Delete this journal entry?')) return; try { const j = await post({ kind: 'log.remove', id }); setP((x) => ({ ...x, log: j.log })); } catch (e: any) { setErr(e.message); } }
  return (
    <div className="no-print" style={{ display: 'grid', gap: 16 }}>
      <div className="panel">
        <h2 style={{ fontSize: '1.3rem' }}>What did you do on your project today?</h2>
        <p style={{ color: 'var(--muted)', marginTop: 0 }}>A few lines each day: what you tried, what worked, what is stuck. This record shows your growth over the 30 days and helps your instructor help you.</p>
        <label htmlFor="jt" style={{ position: 'absolute', left: -9999 }}>Journal entry</label>
        <textarea id="jt" rows={4} maxLength={1500} value={t} onChange={(e) => setT(e.target.value)} placeholder="Today I…" />
        <div className="count">{t.length}/1500</div>
        {err && <div className="error" role="alert">⚠ {err}</div>}
        <button className="btn btn-primary sm" style={{ marginTop: 10 }} disabled={busy || t.trim().length < 3} onClick={add}>{busy ? 'ADDING…' : 'ADD ENTRY'}</button>
      </div>
      {(p.log ?? []).length === 0 ? <p style={{ color: 'var(--muted)' }}>No entries yet. Your first one starts the record.</p> : (p.log ?? []).map((e) => (
        <div className="panel" key={e.id}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><b style={{ fontSize: '.85rem', color: 'var(--muted)' }}>{fmt(e.at)}</b><button className="btn btn-line sm" onClick={() => remove(e.id)} aria-label={`Delete entry from ${fmt(e.at)}`}>Delete</button></div><div style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{e.text}</div></div>
      ))}
    </div>
  );
}

function Proposal({ p, name }: { p: Project; name: string }) {
  const sum = summarize(p);
  return (
    <div>
      <div className="no-print" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={() => window.print()}>PRINT / SAVE AS PDF</button>
        <span style={{ color: 'var(--muted)' }}>Built from your sections ({sum.ready} of {sum.total} ready). Edit them in the Build tab.</span>
      </div>
      <article className="panel proposal" style={{ padding: 'clamp(20px,4vw,44px)' }}>
        <div className="eyebrow">FORGE30 project proposal · SHARIF TECHNOLOGIES</div>
        <h1 style={{ fontSize: 'clamp(1.8rem,5vw,2.6rem)' }}>{p.title || 'Untitled project'}</h1>
        <p style={{ color: 'var(--muted)' }}>Prepared by <b>{name}</b></p>
        {SECTIONS.map((s) => { const t = p.sections?.[s.key]?.text; return (
          <section key={s.key} style={{ padding: 0, margin: '22px 0', background: 'none' }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--brand)', marginBottom: 4 }}>{s.title}</h2>
            {t ? <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{t}</p> : <p style={{ color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>Not written yet.</p>}
          </section>
        ); })}
      </article>
    </div>
  );
}
