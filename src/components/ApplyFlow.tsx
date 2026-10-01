'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { OPTIONS, STEP_SCHEMAS, label, type StepKey } from '@/lib/schema';
import { track } from '@/lib/track';
import { Area, Check, Checks, Radios, Select, Text } from './fields';

type Draft = Record<StepKey, Record<string, any>>;
const EMPTY: Draft = { about: {}, commitment: {}, availability: { periods: [] }, device: {}, finish: {} };
const STEPS: { key: StepKey; title: string; short: string }[] = [
  { key: 'about', title: 'About you', short: 'You' },
  { key: 'commitment', title: 'Your commitment', short: 'Commitment' },
  { key: 'availability', title: 'Availability & format', short: 'Schedule' },
  { key: 'device', title: 'Device & access', short: 'Devices' },
  { key: 'finish', title: 'Budget, certificate & consent', short: 'Finish' },
];
const KEY = 'forge30-draft-v2';

export default function ApplyFlow({ open, notice }: { open: boolean; notice: string }) {
  const [phase, setPhase] = useState<'gate' | 'form' | 'review' | 'done'>('gate');
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(EMPTY);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState('');
  const [ref, setRef] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const started = useRef(false);
  const submitted = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  // restore draft
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s?.d) { setD({ ...EMPTY, ...s.d }); setStep(s.step ?? 0); if (s.phase === 'form' || s.phase === 'review') setPhase(s.phase); started.current = true; }
    } catch {}
    setHydrated(true);
  }, []);
  // persist draft
  useEffect(() => {
    if (!hydrated || phase === 'done') return;
    try { localStorage.setItem(KEY, JSON.stringify({ d, step, phase })); } catch {}
  }, [d, step, phase, hydrated]);
  // abandonment
  useEffect(() => {
    const h = () => { if (started.current && !submitted.current) track('application_abandoned', phase === 'review' ? 'review' : STEPS[step]?.key); };
    window.addEventListener('pagehide', h); return () => window.removeEventListener('pagehide', h);
  }, [phase, step]);
  // focus heading + scroll on step change
  useEffect(() => { if (hydrated) { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'smooth' }); } }, [step, phase, hydrated]);

  const cur = STEPS[step];
  const set = useCallback((sec: StepKey, f: string, v: any) => {
    setD((p) => ({ ...p, [sec]: { ...p[sec], [f]: v } }));
    setErrs((e) => { if (!e[`${sec}.${f}`]) return e; const { [`${sec}.${f}`]: _, ...rest } = e; return rest; });
  }, []);

  function validate(sec: StepKey) {
    const r = STEP_SCHEMAS[sec].safeParse(d[sec]);
    const out: Record<string, string> = {};
    if (!r.success) for (const i of r.error.issues) out[`${sec}.${i.path.join('.')}`] ??= i.message;
    return out;
  }
  const blur = (sec: StepKey, f: string) => {
    setTouched((t) => new Set(t).add(`${sec}.${f}`));
    const e = validate(sec)[`${sec}.${f}`];
    if (e && (d[sec][f] ?? '') !== '') setErrs((p) => ({ ...p, [`${sec}.${f}`]: e }));
  };
  const focusFirst = (keys: string[]) => {
    const first = keys[0]; if (!first) return;
    const id = first.replace('.', '-');
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-field="${id}"]`);
      (el?.querySelector('input,textarea,select') as HTMLElement | null)?.focus({ preventScroll: true });
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };

  function next() {
    const e = validate(cur.key);
    setErrs((p) => { const n = { ...p }; for (const k of Object.keys(n)) if (k.startsWith(cur.key + '.')) delete n[k]; return { ...n, ...e }; });
    if (Object.keys(e).length) { focusFirst(Object.keys(e)); return; }
    track('step_completed', cur.key);
    if (step === STEPS.length - 1) { setPhase('review'); track('step_completed', 'review'); } else setStep(step + 1);
  }
  const back = () => { if (phase === 'review') { setPhase('form'); setStep(STEPS.length - 1); } else if (step > 0) setStep(step - 1); else setPhase('gate'); };
  const edit = (i: number) => { setPhase('form'); setStep(i); };

  async function submit() {
    setBusy(true); setBanner('');
    // re-validate everything client-side
    for (let i = 0; i < STEPS.length; i++) { const e = validate(STEPS[i].key); if (Object.keys(e).length) { setErrs(e); setStep(i); setPhase('form'); setBusy(false); setBanner('Some answers need attention before you can submit.'); return; } }
    try {
      const r = await fetch('/api/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { submitted.current = true; track('application_submitted'); try { localStorage.removeItem(KEY); } catch {} setRef(j.ref); setPhase('done'); }
      else if (r.status === 422 && j.fields) {
        setErrs(j.fields); const secs = Object.keys(j.fields).map((k) => k.split('.')[0]);
        const i = STEPS.findIndex((s) => secs.includes(s.key)); if (i >= 0) { setStep(i); setPhase('form'); }
        setBanner('Some answers need attention.');
      } else setBanner(j.error || 'Submission failed. Please try again.');
    } catch { setBanner('We could not reach the server. Your answers are saved on this device. Check your connection and press Submit again.'); }
    setBusy(false);
  }

  const e = (sec: StepKey, f: string) => errs[`${sec}.${f}`];
  const A = d.about, C = d.commitment, V = d.availability, D = d.device, F = d.finish;
  const progress = phase === 'review' ? 100 : Math.round((step / (STEPS.length + 1)) * 100);

  if (!hydrated) return <div className="app-shell" />;

  if (!open && phase !== 'done') return (
    <div className="app-shell"><Top /><div className="wrap" style={{ maxWidth: 760, padding: '40px 0 80px' }}><div className="form-card" style={{ transform: 'none' }}>
      <h2>Applications are closed</h2>
      <p className="lead">SHARIF TECHNOLOGIES is no longer accepting applications for this cohort. Applications close when the organizer is satisfied that enough have been received.</p>
      {notice && <div className="info amber"><b>Notice</b><p>{notice}</p></div>}
      <Link href="/status" className="btn btn-primary">CHECK AN EXISTING APPLICATION</Link>
    </div></div></div>
  );

  if (phase === 'gate') return (
    <div className="app-shell"><Top />
      <div className="wrap" style={{ padding: '40px 0 80px' }}>
        <div className="gate form-card" style={{ transform: 'none' }}>
          <div className="eyebrow">Read this before applying</div>
          <p className="big">FORGE30 requires 30 consecutive days of serious participation.</p>
          <p className="lead" style={{ marginBottom: 20 }}>If you are only curious about coding, this program may not be suitable for you.</p>
          <ul className="check" style={{ marginBottom: 24 }}>
            <li>A live two-hour session <b>every day for 30 days</b> (60 hours). No recordings to catch up on.</li>
            <li>Your <b>class time is assigned</b> by SHARIF TECHNOLOGIES. You cannot choose it.</li>
            <li>Practice outside the sessions and a <b>final project</b> you present on Day 30.</li>
            <li>Approximately <b>GH₵500</b> arranged for your own project needs (not a training fee).</li>
            <li>Unnecessary absence or serious misconduct may result in dismissal.</li>
            <li>Submitting is an application. <b>It does not guarantee selection.</b></li>
          </ul>
          <div className="info blue"><p>If you are prepared to show up, practise, make mistakes, solve problems and build for 30 days, continue. It takes about 10–15 minutes, and your progress is saved on this device.</p></div>
          {notice && <div className="info amber"><b>Notice</b><p>{notice}</p></div>}
          <div className="actions" style={{ marginTop: 10 }}>
            <Link className="btn btn-line" href="/">Not for me right now</Link>
            <button className="btn btn-primary" onClick={() => { started.current = true; track('gate_passed'); track('application_started'); setPhase('form'); setStep(0); }}>I’M READY TO APPLY <span className="arrow">→</span></button>
          </div>
        </div>
      </div>
    </div>
  );

  if (phase === 'done') return (
    <div className="app-shell"><Top /><div className="wrap" style={{ padding: '40px 0 80px' }}>
      <div className="form-card" style={{ transform: 'none' }} role="status">
        <div className="eyebrow">Submitted</div>
        <h2 ref={heading} tabIndex={-1}>APPLICATION RECEIVED</h2>
        <p className="lead">Your application has been successfully submitted.</p>
        <p>Your reference code. <b>Save it</b> (screenshot it or write it down). You will need it with your email to check your status:</p>
        <p><span className="ref">{ref}</span></p>
        <h3 style={{ marginTop: 28 }}>What happens next</h3>
        <ol className="steps-next">
          <li>Applications remain open until SHARIF TECHNOLOGIES determines that sufficient applications have been received for the selection process.</li>
          <li>The organizer reviews applications and determines the cohort and the delivery arrangement.</li>
          <li>Your class time is assigned by SHARIF TECHNOLOGIES after the application period closes.</li>
          <li>Visit your <b>student dashboard</b> any time for updates. If you are confirmed, your downloadable student card appears there.</li>
        </ol>
        <div className="info amber" style={{ marginTop: 24 }}><b>Submission does not guarantee selection.</b><p style={{ margin: 0 }}>You are not enrolled yet. You will be contacted on the phone number or email you provided.</p></div>
        <div className="actions"><Link className="btn btn-line" href="/">Back to FORGE30</Link><Link className="btn btn-primary" href="/status">STUDENT DASHBOARD</Link></div>
      </div>
    </div></div>
  );

  return (
    <div className="app-shell">
      <Top />
      <div className="app-top" style={{ paddingTop: 0 }}>
        <div className="wrap" style={{ maxWidth: 820 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', color: '#b8cbf3', fontWeight: 700, letterSpacing: '.06em' }}>
            <span>{phase === 'review' ? 'FINAL REVIEW' : `STEP ${step + 1} OF ${STEPS.length}`}</span><span>{progress}% · saved on this device</span>
          </div>
          <nav className="stepper" aria-label="Application progress">
            {STEPS.map((s, i) => { const state = phase === 'review' || i < step ? 'done' : i === step ? 'current' : 'todo'; return (
              <button key={s.key} data-state={state} disabled={!(phase === 'review' || i < step)} onClick={() => edit(i)} aria-current={state === 'current' ? 'step' : undefined} aria-label={`${s.title}${state === 'done' ? ' (completed, edit)' : ''}`}><span>{state === 'done' ? '✓ ' : ''}{s.short}</span><i /></button>
            ); })}
            <button data-state={phase === 'review' ? 'current' : 'todo'} disabled aria-current={phase === 'review' ? 'step' : undefined}><span>Review</span><i /></button>
          </nav>
        </div>
      </div>

      <div className="wrap" style={{ paddingBottom: 100 }}>
        <div className="form-card" key={phase + step} style={{ marginTop: 24, transform: 'none' }}>
          {banner && <div className="info red" role="alert"><b>{banner}</b></div>}
          {Object.keys(errs).length > 0 && phase === 'form' && <div className="info red" role="alert" style={{ padding: '10px 16px' }}>Please fix {Object.keys(errs).length === 1 ? 'the highlighted answer' : 'the highlighted answers'} below.</div>}

          {phase === 'review' ? <Review d={d} edit={edit} heading={heading} /> : (
            <>
              <h2 ref={heading} tabIndex={-1} style={{ outline: 'none' }}>{cur.title}</h2>

              {cur.key === 'about' && (<>
                <p className="lead">We only ask what we need to review your application and contact you.</p>
                <Text id="about-fullName" label="Full name" required value={A.fullName} error={e('about', 'fullName')} onChange={(v) => set('about', 'fullName', v)} onBlur={() => blur('about', 'fullName')} autoComplete="name" maxLength={100} />
                <Text id="about-preferredName" label="Preferred name" hint="What should we call you? Optional." value={A.preferredName} error={e('about', 'preferredName')} onChange={(v) => set('about', 'preferredName', v)} maxLength={60} />
                <Text id="about-phone" label="Phone number (WhatsApp preferred)" required type="tel" inputMode="tel" autoComplete="tel" placeholder="024 123 4567" value={A.phone} error={e('about', 'phone')} onChange={(v) => set('about', 'phone', v)} onBlur={() => blur('about', 'phone')} />
                <Text id="about-email" label="Email address" required type="email" inputMode="email" autoComplete="email" value={A.email} error={e('about', 'email')} onChange={(v) => set('about', 'email', v)} onBlur={() => blur('about', 'email')} maxLength={200} />
                <Text id="about-location" label="Where do you live?" hint="Town or city, and region." required value={A.location} error={e('about', 'location')} onChange={(v) => set('about', 'location', v)} onBlur={() => blur('about', 'location')} autoComplete="address-level2" maxLength={120} />
                <Select id="about-ageBracket" label="Age bracket" required options={OPTIONS.ageBracket} value={A.ageBracket} error={e('about', 'ageBracket')} onChange={(v) => set('about', 'ageBracket', v)} />
                {A.ageBracket === 'under18' && <div className="info amber"><b>Under 18</b><p>You may apply. A parent or guardian should know about your application and your daily two-hour commitment.</p></div>}
                <Radios id="about-experience" label="Previous technical experience" required options={OPTIONS.experience} value={A.experience} error={e('about', 'experience')} onChange={(v) => set('about', 'experience', v)} />
                {A.experience === 'none' && <div className="info blue"><b>Starting from zero is fine.</b><p>The program starts from the fundamentals.</p></div>}
              </>)}

              {cur.key === 'commitment' && (<>
                <p className="lead">Honest answers help us form a cohort that can finish together.</p>
                <Area id="commitment-why" label="Why do you want to become a developer?" required value={C.why} error={e('commitment', 'why')} onChange={(v) => set('commitment', 'why', v)} onBlur={() => blur('commitment', 'why')} hint="At least a few sentences." />
                <Area id="commitment-hopeToBuild" label="What do you hope to be able to build after the program?" required value={C.hopeToBuild} error={e('commitment', 'hopeToBuild')} onChange={(v) => set('commitment', 'hopeToBuild', v)} onBlur={() => blur('commitment', 'hopeToBuild')} />
                <Radios id="commitment-canCommit" label="Can you commit to a live 2-hour session every day for 30 consecutive days?" required two options={[['yes', 'Yes, I understand and can commit.'], ['no', 'No, I cannot.']]} value={C.canCommit} error={e('commitment', 'canCommit') && C.canCommit !== 'no' ? e('commitment', 'canCommit') : undefined} onChange={(v) => set('commitment', 'canCommit', v)} />
                {C.canCommit === 'no' && <div className="info red" role="alert"><b>This cohort may not be the right fit.</b><p>FORGE30 requires a live 2-hour session every day for 30 consecutive days. Your application cannot proceed without this commitment. Please watch for a future cohort.</p><p><Link href="/">Return to the program page</Link></p></div>}
                <Radios id="commitment-practise" label="Are you prepared to practise outside the live sessions?" required two options={[['yes', 'Yes'], ['no', 'No']]} value={C.practise} error={e('commitment', 'practise')} onChange={(v) => set('commitment', 'practise', v)} />
                <Radios id="commitment-seriousness" label="Which statement best describes you?" required options={OPTIONS.seriousness} value={C.seriousness} error={e('commitment', 'seriousness')} onChange={(v) => set('commitment', 'seriousness', v)} hint="There is no wrong answer; we would rather know now." />
                <div className="info amber" style={{ marginTop: 28 }}><b>Discipline acknowledgement</b><p>I understand that FORGE30 is an intensive live program. I understand that attendance, participation, discipline and practical work are expected throughout the 30 days. I understand that unnecessary absence or serious misconduct may result in dismissal.</p></div>
                <Check id="commitment-ackDiscipline" checked={C.ackDiscipline} error={e('commitment', 'ackDiscipline')} onChange={(v) => set('commitment', 'ackDiscipline', v)}><b>I understand and accept these conditions.</b></Check>
              </>)}

              {cur.key === 'availability' && (<>
                <div className="info blue"><b>Your class time is assigned by SHARIF TECHNOLOGIES.</b><p>You do not choose it. The final timetable is determined after the application period closes.</p></div>
                <Checks id="availability-periods" label="Which periods are you generally available?" required options={OPTIONS.period} value={V.periods} error={e('availability', 'periods')} onChange={(v) => set('availability', 'periods', v)} hint="This helps with planning. It does not guarantee your final class time." />
                {V.periods?.includes('other') && <Text id="availability-periodOther" label="Which other period?" required value={V.periodOther} error={e('availability', 'periodOther')} onChange={(v) => set('availability', 'periodOther', v)} maxLength={200} />}
                <Radios id="availability-format" label="Which arrangement would you prefer?" required options={OPTIONS.format} value={V.format} error={e('availability', 'format')} onChange={(v) => set('availability', 'format', v)} />
                <div className="hint" style={{ marginTop: -10, marginBottom: 20 }}>This is a preference only. It does not determine the final format. The final arrangement is determined by SHARIF TECHNOLOGIES after applications close.</div>
                {(V.format === 'remote' || V.format === 'either') && <div className="info"><b>If remote</b><p>You would need a reliable internet connection, dependable power, and a quiet place to join a live session for two hours every day. You will be asked about these on the next steps.</p></div>}
                {(V.format === 'in_person' || V.format === 'either') && (<>
                  <div className="info amber"><b>In-person costs</b><p>An in-person arrangement may involve additional logistical costs. This is for planning only; it is not a course fee and it does not affect your chance of selection.</p></div>
                  <Radios id="availability-contribPref" label="If an in-person arrangement is selected, how would you feel about contributing toward associated costs?" required options={OPTIONS.contribPref} value={V.contribPref} error={e('availability', 'contribPref')} onChange={(v) => set('availability', 'contribPref', v)} />
                  <Radios id="availability-contribRange" label="If you would be willing to contribute, what amount would you personally be comfortable contributing?" required two options={OPTIONS.contribRange} value={V.contribRange} error={e('availability', 'contribRange')} onChange={(v) => set('availability', 'contribRange', v)} hint="Choose GH₵0 or “Prefer to discuss” if that is your situation. A higher amount does not improve your chances." />
                </>)}
              </>)}

              {cur.key === 'device' && (<>
                <p className="lead">We need to know the real equipment of the cohort. Do not assume everyone owns a laptop. Answer honestly.</p>
                <Radios id="device-phone" label="Mobile phone" required two options={OPTIONS.phone} value={D.phone} error={e('device', 'phone')} onChange={(v) => set('device', 'phone', v)} />
                <Radios id="device-computer" label="Computer" required two options={OPTIONS.computer} value={D.computer} error={e('device', 'computer')} onChange={(v) => set('device', 'computer', v)} />
                {D.computer === 'none' && (<>
                  <div className="info amber"><b>No computer</b><p>You can still apply, but the program is practical and you would need regular access to a computer for daily practice. Please tell us whether you could use a shared one. How this is handled is decided by SHARIF TECHNOLOGIES.</p></div>
                  <Radios id="device-sharedComputer" label="Can you regularly use a shared computer (home, work, friend, café)?" required options={OPTIONS.sharedComputer} value={D.sharedComputer} error={e('device', 'sharedComputer')} onChange={(v) => set('device', 'sharedComputer', v)} />
                </>)}
                {D.computer === 'other' && <Text id="device-deviceNote" label="What kind of computer?" value={D.deviceNote} onChange={(v) => set('device', 'deviceNote', v)} maxLength={300} />}
                <Radios id="device-internet" label="Internet availability" required options={OPTIONS.internet} value={D.internet} error={e('device', 'internet')} onChange={(v) => set('device', 'internet', v)} />
                {(D.internet === 'unreliable' || D.internet === 'none') && <div className="info"><b>Internet matters</b><p>If classes are remote you would need a dependable connection for two hours daily. Tell us as it is; the organizer will consider it when deciding the delivery arrangement.</p></div>}
                <Radios id="device-electricity" label="Electricity access" required options={OPTIONS.electricity} value={D.electricity} error={e('device', 'electricity')} onChange={(v) => set('device', 'electricity', v)} />
                <Radios id="device-workspace" label="Do you have access to a suitable workspace?" required options={OPTIONS.workspace} value={D.workspace} error={e('device', 'workspace')} onChange={(v) => set('device', 'workspace', v)} hint="Somewhere you can focus for two hours and practise." />
              </>)}

              {cur.key === 'finish' && (<>
                <p className="lead">Your project is built after you apply. Inside your student dashboard you will develop your idea, problem, users, solution and proposal step by step, all the way to Day 30. Start thinking about something you genuinely care about.</p>
                <div className="info amber"><b>Project budget</b><p>Applicants should be prepared to arrange approximately GH₵500 for their project-development needs. This is <b>not</b> a training fee and not a payment to join. The exact use depends on the project, and we cannot guarantee it will be sufficient for every project.</p></div>
                <Radios id="finish-budget" label="Are you prepared to arrange approximately GH₵500 toward project-related development expenses?" required options={OPTIONS.budget} value={F.budget} error={e('finish', 'budget')} onChange={(v) => set('finish', 'budget', v)} />
                <Radios id="finish-certificate" label="Would you like to receive a certificate of completion if you successfully complete the program?" required two options={OPTIONS.certificate} value={F.certificate} error={e('finish', 'certificate')} onChange={(v) => set('finish', 'certificate', v)} />
                <div className="hint" style={{ marginTop: -10, marginBottom: 24 }}>Certificates are associated with successful completion of the program requirements and are not automatically issued simply because someone registered.</div>
                <div className="info"><b>Privacy</b><p>We use your answers only to review applications, form the cohort, plan delivery and contact you. We do not publish them. Read the <Link href="/privacy" target="_blank">privacy notice</Link>.</p></div>
                <Check id="finish-privacy" checked={F.privacy} error={e('finish', 'privacy')} onChange={(v) => set('finish', 'privacy', v)}>I have read the privacy notice and agree that SHARIF TECHNOLOGIES may use my answers for these purposes.</Check>
              </>)}
            </>
          )}

          <div className="actions">
            <button className="btn btn-line" onClick={back} disabled={busy}>← Back</button>
            {phase === 'review'
              ? <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'SUBMITTING…' : 'SUBMIT APPLICATION'}</button>
              : <button className="btn btn-primary" onClick={next} disabled={cur.key === 'commitment' && C.canCommit === 'no'}>{step === STEPS.length - 1 ? 'REVIEW MY APPLICATION' : 'CONTINUE'} <span className="arrow">→</span></button>}
          </div>
          {phase === 'review' && <p className="note" style={{ marginTop: 16 }}>Submitting is an application. It is not enrolment, and it does not guarantee selection.</p>}
        </div>
      </div>
    </div>
  );
}

function Top() {
  return (
    <header className="hdr"><div className="wrap row">
      <Link href="/" className="brand" aria-label="FORGE30 home"><Image src="/brand/sharif-logo-512.png" alt="SHARIF TECHNOLOGIES" width={40} height={40} /><span>FORGE30<small>SHARIF TECHNOLOGIES</small></span></Link>
      <Link href="/" style={{ color: '#d6e1fa', fontWeight: 600, textDecoration: 'none' }}>✕ Exit</Link>
    </div></header>
  );
}

function Review({ d, edit, heading }: { d: Draft; edit: (i: number) => void; heading: React.RefObject<HTMLHeadingElement | null> }) {
  const A = d.about, C = d.commitment, V = d.availability, D = d.device, F = d.finish;
  const Sec = ({ t, i, rows }: { t: string; i: number; rows: [string, any][] }) => (
    <section><header><b>{t}</b><button onClick={() => edit(i)} aria-label={`Edit ${t}`}>Edit</button></header>
      <dl>{rows.filter((r) => r[1] !== undefined && r[1] !== '').map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></section>
  );
  return (<>
    <h2 ref={heading} tabIndex={-1} style={{ outline: 'none' }}>Review your application</h2>
    <p className="lead">Check everything. Use Edit to change an answer.</p>
    <div className="review">
      <Sec t="Your information" i={0} rows={[['Full name', A.fullName], ['Preferred name', A.preferredName], ['Phone', A.phone], ['Email', A.email], ['Location', A.location], ['Age bracket', label('ageBracket', A.ageBracket)], ['Technical experience', label('experience', A.experience)]]} />
      <Sec t="Your commitment" i={1} rows={[['Why become a developer', C.why], ['What you hope to build', C.hopeToBuild], ['Can commit to 30 consecutive days, 2 hours daily', 'Yes, I understand and can commit.'], ['Will practise outside sessions', C.practise === 'yes' ? 'Yes' : 'No'], ['Self-description', label('seriousness', C.seriousness)], ['Discipline acknowledgement', 'Accepted']]} />
      <Sec t="Your availability" i={2} rows={[['General availability', (V.periods || []).map((p: string) => label('period', p)).join(', ') + (V.periodOther ? ` (${V.periodOther})` : '')], ['Note', 'Not a reservation. Class time is assigned by SHARIF TECHNOLOGIES.']]} />
      <Sec t="Your learning-format preference" i={2} rows={[['Preference', label('format', V.format)], ['In-person contribution preference', V.format !== 'remote' ? label('contribPref', V.contribPref) : undefined], ['Comfortable contribution range', V.format !== 'remote' ? label('contribRange', V.contribRange) : undefined]]} />
      <Sec t="Your device" i={3} rows={[['Phone', label('phone', D.phone)], ['Computer', label('computer', D.computer)], ['Shared computer access', D.computer === 'none' ? label('sharedComputer', D.sharedComputer) : undefined], ['Internet', label('internet', D.internet)], ['Electricity', label('electricity', D.electricity)], ['Workspace', label('workspace', D.workspace)]]} />
      <Sec t="Budget, certificate & consent" i={4} rows={[['GH₵500 project budget', label('budget', F.budget)], ['Certificate', label('certificate', F.certificate)], ['Privacy notice', 'Agreed']]} />
    </div>
  </>);
}
