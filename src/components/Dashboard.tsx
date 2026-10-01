'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { CONTACT_METHODS, CONTACT_TIMES, STATUS_LABEL, type Status } from '@/lib/schema';
import type { Organizer } from '@/lib/settings';
import { Radios, Text } from './fields';
import PhotoPrep from './PhotoPrep';

type Me = { ref: string; name: string; email: string; phone: string; status: Status; studentId: string | null; photoChangesLeft: number; seat: string; group: string; session: string; hasPhoto: boolean; submitted: string; contact: Record<string, string> };
type S = { cohortName: string; cohortDates: string; delivery: string; classArrangement: string; notice: string; announcements: { id: string; text: string; at: string }[]; organizer: Organizer };

const STAGES: Status[] = ['submitted', 'under_review', 'selected', 'confirmed'];
const MSG: Record<Status, string> = {
  submitted: 'Your application has been received and is waiting to be reviewed.',
  under_review: 'Your application is being reviewed.',
  selected: 'You have been selected. SHARIF TECHNOLOGIES will contact you with next steps. Your place is not final until it is confirmed.',
  confirmed: 'Your place is confirmed. You can now create your student card below.',
  not_selected: 'Thank you for applying. You were not selected for this cohort.',
  withdrawn: 'This application has been withdrawn.',
};
const tbd = (v: string) => !v || /^to be determined/i.test(v);

type ProjectSummary = { ready: number; started: number; total: number; nextTitle: string | null; title: string; feedback: number; journal: number };

export function Dashboard({ me, settings: s, cardToken, project }: { me: Me; settings: S; cardToken: string | null; project: ProjectSummary | null }) {
  const router = useRouter();
  const idx = STAGES.indexOf(me.status);
  const first = me.name.split(' ')[0];
  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div><div className="eyebrow">Student dashboard</div><h1 style={{ fontSize: 'clamp(1.9rem,6vw,3rem)', marginBottom: 4 }}>Welcome, {first}.</h1>
          <div style={{ color: 'var(--muted)' }}>Reference <b style={{ fontFamily: 'ui-monospace,Menlo,monospace' }}>{me.ref}</b> · Applied {me.submitted}</div></div>
        <button className="btn btn-line sm" onClick={async () => { await fetch('/api/student/logout', { method: 'POST' }); router.replace('/status'); router.refresh(); }}>Sign out</button>
      </div>

      <section className="panel" style={{ padding: 0, background: 'var(--navy-900)', color: '#fff', borderColor: 'var(--navy-900)' }} aria-label="Application status">
        <div style={{ padding: '22px 24px 8px' }}>
          <div className="eyebrow" style={{ color: 'var(--amber)' }}>Your status</div>
          <div style={{ fontSize: 'clamp(1.6rem,5vw,2.4rem)', fontWeight: 800, letterSpacing: '-.02em' }}>{STATUS_LABEL[me.status]}</div>
          <p style={{ color: '#c5d3f2', margin: '6px 0 0' }}>{MSG[me.status]}</p>
        </div>
        {idx >= 0 ? (
          <ol style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, margin: 0, padding: '18px 24px 24px' }}>
            {STAGES.map((st, i) => (
              <li key={st} aria-current={i === idx ? 'step' : undefined}>
                <div style={{ height: 6, borderRadius: 3, background: i <= idx ? 'var(--amber)' : 'var(--line-dark)' }} />
                <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.05em', marginTop: 8, color: i <= idx ? '#fff' : '#7f97cf' }}>{i < idx ? '✓ ' : ''}{STATUS_LABEL[st].toUpperCase()}</div>
              </li>
            ))}
          </ol>
        ) : <div style={{ height: 22 }} />}
      </section>

      {(s.notice || s.announcements.length > 0) && (
        <section className="panel" aria-label="Updates">
          <h2 style={{ fontSize: '1.3rem' }}>Updates from SHARIF TECHNOLOGIES</h2>
          {s.notice && <div className="info amber"><b>Notice</b><p>{s.notice}</p></div>}
          {s.announcements.map((a) => <div key={a.id} style={{ padding: '12px 0', borderTop: '1px solid var(--line)' }}><div style={{ fontSize: '.8rem', color: 'var(--muted)', fontWeight: 700 }}>{new Date(a.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>{a.text}</div>)}
        </section>
      )}

      {project && (
        <section className="panel" aria-label="My project" style={{ borderLeft: '6px solid var(--brand)' }}>
          <div className="eyebrow">My project</div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 4 }}>{project.title || 'Start building your project proposal'}</h2>
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>{project.started === 0 ? 'Develop your idea, problem, users and solution a little at a time, all the way to Day 30. It saves as you type.' : project.nextTitle ? <>Next up: <b>{project.nextTitle}</b></> : 'Every section is ready. Polish it and prepare to present on Day 30.'}</p>
          <div className="progress-bar" style={{ background: 'var(--tint-2)' }} role="progressbar" aria-valuenow={Math.round((project.ready / project.total) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Project completion"><i style={{ width: `${(project.ready / project.total) * 100}%`, background: 'var(--brand)' }} /></div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <a className="btn btn-primary" href="/dashboard/project">{project.started === 0 ? 'START MY PROJECT' : 'CONTINUE MY PROJECT'} <span className="arrow">→</span></a>
            <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{project.ready} of {project.total} sections ready · {project.journal} journal {project.journal === 1 ? 'entry' : 'entries'}{project.feedback > 0 ? ` · ${project.feedback} instructor ${project.feedback === 1 ? 'note' : 'notes'}` : ''}</span>
          </div>
        </section>
      )}

      <section className="panel" aria-label="My program">
        <h2 style={{ fontSize: '1.3rem' }}>My program</h2>
        <div className="grid g2">
          <Fact k="Cohort" v={s.cohortName} /><Fact k="Program dates" v={s.cohortDates} />
          <Fact k="Delivery arrangement" v={s.delivery} /><Fact k="Class arrangement" v={s.classArrangement} />
          <Fact k="Your group" v={me.group || 'To be assigned by SHARIF TECHNOLOGIES'} dim={!me.group} />
          <Fact k="Your class time" v={me.session || 'To be assigned by SHARIF TECHNOLOGIES'} dim={!me.session} />
          {me.seat && <Fact k="Your seat" v={me.seat} />}
        </div>
        <p className="note" style={{ marginBottom: 0 }}>Your class time is assigned by SHARIF TECHNOLOGIES. You do not choose it.</p>
      </section>

      {cardToken ? <CardPanel token={cardToken} hasPhoto={me.hasPhoto} studentId={me.studentId!} changesLeft={me.photoChangesLeft} /> : (
        <section className="panel" aria-label="Student card"><h2 style={{ fontSize: '1.3rem' }}>Student card</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>Your downloadable FORGE30 student card, with your photo, student ID and serial number, unlocks here once your place is <b>confirmed</b> by SHARIF TECHNOLOGIES.</p></section>
      )}

      <ContactForm me={me} />
      <OrganizerCard o={s.organizer} />
    </div>
  );
}

const Fact = ({ k, v, dim }: { k: string; v: string; dim?: boolean }) => <div><div style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>{k}</div><div style={{ fontWeight: 600, color: dim || tbd(v) ? 'var(--muted)' : 'var(--ink)' }}>{v}</div></div>;

/* ---------- Student card: passport photo upload, preview, download ---------- */
function Flip3D({ front, back, alt }: { front: string; back: string; alt: string }) {
  const [flipped, setFlipped] = useState(false); const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = e.currentTarget.getBoundingClientRect(); setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -14, y: ((e.clientX - r.left) / r.width - 0.5) * 18 });
  };
  const face: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: 16, boxShadow: '0 18px 50px rgba(7,18,48,.35)' };
  return (
    <div>
      <div style={{ perspective: 1400 }} onPointerMove={move} onPointerLeave={() => setTilt({ x: 0, y: 0 })}>
        <button onClick={() => setFlipped((f) => !f)} aria-label={`Flip card to see the ${flipped ? 'front' : 'back'}`} style={{ display: 'block', width: '100%', aspectRatio: '1012 / 638', padding: 0, border: 0, background: 'none', cursor: 'pointer', position: 'relative', transformStyle: 'preserve-3d', transition: 'transform .8s cubic-bezier(.2,.7,.2,1)', transform: `rotateX(${tilt.x}deg) rotateY(${(flipped ? 180 : 0) + tilt.y}deg)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={front} alt={`${alt} front`} style={face} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={back} alt={`${alt} back`} style={{ ...face, transform: 'rotateY(180deg)' }} />
        </button>
      </div>
      <p className="note" style={{ marginTop: 14 }}>Tap the card to flip it. Move your pointer over it to tilt it.</p>
    </div>
  );
}

function CardPanel({ token, hasPhoto, studentId, changesLeft: initialLeft }: { token: string; hasPhoto: boolean; studentId: string; changesLeft: number }) {
  const [photo, setPhoto] = useState(hasPhoto); const [v, setV] = useState(Date.now()); const [left, setLeft] = useState(initialLeft);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const input = useRef<HTMLInputElement>(null); const camera = useRef<HTMLInputElement>(null);
  const [prep, setPrep] = useState<{ file: File; from: React.RefObject<HTMLInputElement | null> } | null>(null);
  const locked = photo && left <= 0;
  const pick = (f: File | undefined, from: React.RefObject<HTMLInputElement | null>) => { if (f) setPrep({ file: f, from }); };
  // The student first prepares the photo (auto-centred passport crop); only then is it uploaded.
  async function upload(blob: Blob | null) {
    const from = prep?.from; setPrep(null); if (from?.current) from.current.value = '';
    if (!blob) return;
    setBusy(true); setErr('');
    try {
      const fd = new FormData(); fd.append('token', token); fd.append('photo', blob, 'photo.jpg');
      const r = await fetch('/api/card/photo', { method: 'POST', body: fd }); const j = await r.json().catch(() => ({}));
      if (r.ok) { if (photo) setLeft(j.changesLeft ?? left - 1); setPhoto(true); setV(Date.now()); } else { setErr(j.error || 'Upload failed. Try again.'); if (j.locked) setLeft(0); }
    } catch { setErr('Network problem. Check your connection and try again.'); }
    setBusy(false);
  }
  const url = (sd: string, dl = false) => `/api/card/image?t=${encodeURIComponent(token)}&side=${sd}${dl ? '&dl=1' : ''}&v=${v}`;
  return (
    <section className="panel" aria-label="Student card" id="card">
      <div className="eyebrow">Student card · {studentId}</div>
      <h2 style={{ fontSize: '1.5rem' }}>{photo ? 'Your FORGE30 student card' : 'Add your passport photo to create your card'}</h2>
      {!photo && <p style={{ color: 'var(--muted)' }}>Use a clear, front-facing passport-style photo: plain background, face fully visible, no sunglasses or hat. <b>Choose carefully: you can change it only once afterwards.</b> Your photo appears on your card, and is shown to anyone who scans your card’s QR code so they can match it to you.</p>}
      {/* Two inputs: one opens the camera, the other opens the gallery / file picker (no `capture`). */}
      <input ref={camera} type="file" accept="image/*" capture="user" hidden onChange={(e) => pick(e.target.files?.[0], camera)} id="photo-camera" />
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/*" hidden onChange={(e) => pick(e.target.files?.[0], input)} id="photo-file" />
      {photo && (<>
        <Flip3D front={url('front')} back={url('back')} alt="Student card" />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          <a className="btn btn-primary" href={url('front', true)} download>DOWNLOAD FRONT</a>
          <a className="btn btn-primary" href={url('back', true)} download>DOWNLOAD BACK</a>
          <a className="btn btn-line" href={url('3d', true)} download>3D SHOWCASE (OPTIONAL)</a>
        </div>
        <p className="note" style={{ marginTop: 14 }}>Print size: standard ID card (85.6 × 54 mm). The QR code opens your verification page. Seat, group and class time appear once assigned; download again for the latest version.</p>
      </>)}
      {locked && <div className="info amber" style={{ marginTop: 14 }}><b>Your photo is locked</b><p style={{ margin: 0 }}>You have used your photo change. To change it again, present a legal document or card showing your photo (for example a Ghana Card, passport or driver’s licence) to SHARIF TECHNOLOGIES. An administrator will verify you and unlock one more change.</p></div>}
      {err && <div className="error" role="alert" style={{ marginTop: 10 }}>⚠ {err}</div>}
      {prep && <PhotoPrep file={prep.file} onDone={upload} warn={photo ? <><b>You can change your photo only {left === 1 ? 'once' : `${left} more times`}.</b> After that it is locked, and any further change needs a legal document or card showing your photo, verified by SHARIF TECHNOLOGIES.</> : undefined} />}
      {!locked && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className={'btn ' + (photo ? 'btn-line' : 'btn-primary')} disabled={busy} onClick={() => camera.current?.click()}>{busy ? 'UPLOADING…' : photo ? 'TAKE NEW PHOTO' : 'TAKE PHOTO'}</button>
            <button className="btn btn-line" disabled={busy} onClick={() => input.current?.click()}>{photo ? 'CHOOSE FROM FILES' : 'CHOOSE FROM GALLERY / FILES'}</button>
          </div>
          {photo && <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontWeight: 600 }}>{left === 1 ? '1 change left' : `${left} changes left`}</p>}
        </div>
      )}
    </section>
  );
}

/* ---------- Contact details ---------- */
function ContactForm({ me }: { me: Me }) {
  const [c, setC] = useState<Record<string, string>>({ whatsapp: '', altPhone: '', preferredMethod: '', bestTime: '', emergencyName: '', emergencyPhone: '', ...me.contact });
  const [errs, setErrs] = useState<Record<string, string>>({}); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => { setC((p) => ({ ...p, [k]: v })); setErrs((e) => { const { [k]: _, ...r } = e; return r; }); setMsg(''); };
  const done = !!me.contact?.preferredMethod;
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/student/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) }); const j = await r.json().catch(() => ({}));
      if (r.ok) setMsg('Saved. SHARIF TECHNOLOGIES will use these details to reach you.'); else { setErrs(j.fields || {}); setMsg(j.error || 'Could not save.'); }
    } catch { setMsg('Network problem. Check your connection and try again.'); }
    setBusy(false);
  }
  return (
    <form className="panel" onSubmit={save} noValidate aria-label="Contact details" id="contact">
      <h2 style={{ fontSize: '1.3rem' }}>How should we reach you?</h2>
      {!done && <div className="info amber"><b>Please complete this</b><p>So SHARIF TECHNOLOGIES can contact you about your place, your class time and updates.</p></div>}
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>We already have <b>{me.phone}</b> and <b>{me.email}</b> from your application. Add anything else that helps us reach you.</p>
      <Text id="c-whatsapp" label="WhatsApp number" hint="If different from your phone number." type="tel" inputMode="tel" value={c.whatsapp} error={errs.whatsapp} onChange={(v) => set('whatsapp', v)} />
      <Text id="c-alt" label="Alternative phone number" type="tel" inputMode="tel" value={c.altPhone} error={errs.altPhone} onChange={(v) => set('altPhone', v)} />
      <Radios id="c-method" label="Best way to reach you" required two options={CONTACT_METHODS} value={c.preferredMethod} error={errs.preferredMethod} onChange={(v) => set('preferredMethod', v)} />
      <Radios id="c-time" label="Best time to reach you" required two options={CONTACT_TIMES} value={c.bestTime} error={errs.bestTime} onChange={(v) => set('bestTime', v)} />
      <fieldset><legend className="lab">Emergency contact <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></legend>
        <div className="hint">Someone we can call if we cannot reach you or there is an emergency during an in-person session.</div>
        <Text id="c-en" label="Their name" value={c.emergencyName} onChange={(v) => set('emergencyName', v)} />
        <Text id="c-ep" label="Their phone number" type="tel" inputMode="tel" value={c.emergencyPhone} error={errs.emergencyPhone} onChange={(v) => set('emergencyPhone', v)} />
      </fieldset>
      <button className="btn btn-primary" disabled={busy}>{busy ? 'SAVING…' : 'SAVE CONTACT DETAILS'}</button>
      {msg && <div role="status" style={{ marginTop: 12, fontWeight: 700, color: msg.startsWith('Saved') ? 'var(--ok)' : 'var(--err)' }}>{msg}</div>}
    </form>
  );
}

/* ---------- Organizer ---------- */
export function OrganizerCard({ o, dark }: { o: Organizer; dark?: boolean }) {
  const links = [o.website && ['Website', o.website.replace(/^https?:\/\//, ''), o.website], o.email && ['Email', o.email, `mailto:${o.email}`], o.phone && ['Phone', o.phone, `tel:${o.phone.replace(/\s/g, '')}`], o.whatsapp && ['WhatsApp', o.whatsapp, `https://wa.me/${o.whatsapp.replace(/[^\d]/g, '')}`]].filter(Boolean) as string[][];
  return (
    <section className="panel" aria-label="Contact the organizer" style={dark ? { background: 'var(--navy-800)', borderColor: 'var(--line-dark)', color: '#fff' } : undefined}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Image unoptimized src="/brand/sharif-logo.png" alt="" width={64} height={64} style={{ borderRadius: '50%' }} />
        <div style={{ flex: '1 1 260px' }}>
          <div className="eyebrow" style={{ margin: 0, color: dark ? 'var(--amber)' : undefined }}>{o.title || 'Organizer'}</div>
          <h2 style={{ fontSize: '1.4rem', margin: '2px 0 6px' }}>{o.name}</h2>
          {o.location && <div style={{ color: dark ? '#b8cbf3' : 'var(--muted)', fontSize: '.92rem' }}>{o.location}</div>}
        </div>
      </div>
      {o.bio && <p style={{ marginTop: 14, color: dark ? '#d6e1fa' : undefined }}>{o.bio}</p>}
      {links.length > 0 && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{links.map(([k, t, h]) => <a key={k} className={'btn sm ' + (dark ? 'btn-ghost' : 'btn-line')} href={h} target={h.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={dark ? { color: '#fff' } : undefined}>{k}: {t}</a>)}</div>}
    </section>
  );
}
