'use client';
import { useEffect, useRef, useState } from 'react';
import { DEVICES, FAQ, STAGES } from '@/lib/content';

/* Hero: drag through the 30 days, watch the hours build to 60 */
export function DayTracker() {
  const [d, setD] = useState(15);
  return (
    <div className="tracker" role="group" aria-label="Explore the 30 days">
      <div className="lbl">Drag to explore the commitment</div>
      <div className="big" aria-live="polite">Day {d}<small> of 30</small></div>
      <div style={{ margin: '6px 0 4px', fontWeight: 700 }}>{d * 2} <span style={{ color: '#b8cbf3', fontWeight: 600 }}>of 60 hours completed</span></div>
      <input className="range" type="range" min={1} max={30} value={d} aria-label="Day of the program" style={{ ['--p' as any]: `${((d - 1) / 29) * 100}%` }} onChange={(e) => setD(+e.target.value)} />
      <div className="ticks" aria-hidden><span>Day 1</span><span>Day 10</span><span>Day 20</span><span>Day 30</span></div>
      <p className="note" style={{ marginTop: 14, marginBottom: 0 }}>{d === 30 ? 'Day 30: you submit your project package and present what you built.' : d === 1 ? 'Day 1: two live hours, then practice. Then you come back tomorrow.' : `2 live hours today, then independent practice. ${30 - d} days to go.`}</p>
    </div>
  );
}

/* 30-day journey: stage tabs with keyboard support */
export function Journey() {
  const [i, setI] = useState(0);
  const s = STAGES[i];
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const go = (n: number) => { const k = (n + STAGES.length) % STAGES.length; setI(k); refs.current[k]?.focus(); refs.current[k]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); };
  return (
    <div>
      <div className="chips" role="tablist" aria-label="Program stages" onKeyDown={(e) => { if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); } }}>
        {STAGES.map((st, n) => (
          <button key={st.id} ref={(el) => { refs.current[n] = el; }} role="tab" id={`tab-${st.id}`} aria-selected={i === n} aria-controls="stage-panel" tabIndex={i === n ? 0 : -1} className="chip" onClick={() => setI(n)}>
            <span className="no">{String(n + 1).padStart(2, '0')}</span>{st.name}
          </button>
        ))}
      </div>
      <div className="progress-bar" aria-hidden><i style={{ width: `${((i + 1) / STAGES.length) * 100}%` }} /></div>
      <div id="stage-panel" role="tabpanel" aria-labelledby={`tab-${s.id}`} className="detail" key={s.id}>
        <div>
          <div className="eyebrow">Program area {i + 1} of {STAGES.length}</div>
          <h3 style={{ fontSize: 'clamp(1.8rem,5vw,2.8rem)' }}>{s.name}</h3>
          <p className="lead">{s.blurb}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <button className="btn btn-ghost" onClick={() => go(i - 1)} aria-label="Previous stage">← Previous</button>
            <button className="btn btn-ghost" onClick={() => go(i + 1)} aria-label="Next stage">Next →</button>
          </div>
        </div>
        <div className="panel"><b style={{ display: 'block', marginBottom: 14 }}>What you can expect to encounter</b><ul>{s.items.map((t) => <li key={t}>{t}</li>)}</ul></div>
      </div>
      <p className="note" style={{ marginTop: 24 }}>These are program areas, not a day-by-day syllabus. The exact sequence of topics is to be determined by SHARIF TECHNOLOGIES.</p>
    </div>
  );
}

/* Commitment counter: tap a day to see the hours stack up */
export function CommitCounter() {
  const [n, setN] = useState(0);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }} aria-live="polite">
        <span style={{ fontSize: 'clamp(2.6rem,8vw,4rem)', fontWeight: 800, lineHeight: 1 }}>{n * 2}<small style={{ fontSize: '1rem', fontWeight: 600, color: '#cfe0ff' }}> hours</small></span>
        <span style={{ color: '#cfe0ff' }}>{n === 0 ? 'Tap a day to see the commitment build.' : `after ${n} consecutive ${n === 1 ? 'day' : 'days'}`}</span>
      </div>
      <div className="days" role="group" aria-label="30 days">
        {Array.from({ length: 30 }, (_, k) => k + 1).map((k) => (
          <button key={k} className={k <= n ? 'on' : ''} aria-pressed={k <= n} aria-label={`Day ${k}: ${k * 2} hours in total`} onClick={() => setN(k === n ? 0 : k)}>{k}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost sm" onClick={() => setN(30)}>Show all 30 days</button>
        <button className="btn btn-ghost sm" onClick={() => setN(0)}>Reset</button>
      </div>
    </div>
  );
}

/* Project builder */
const PB = [
  ['Problem', 'Start with something real.', 'What annoys you or the people around you? Where do people waste time, money or effort?', 'Example: “Small shops in my area lose track of who owes them money.”'],
  ['Idea', 'Turn it into a software idea.', 'What could a simple application do about it? It does not have to be clever. It has to be yours.', 'Example: “A simple app where a shop owner records customers and what they owe.”'],
  ['Solution', 'Decide how it would work.', 'Who uses it, what do they do first, and what do they see? You will refine this during the program.', 'Example: “The owner logs in, adds a customer, records a debt, and sees a list of balances.”'],
  ['Build', 'Build it, step by step, with guidance.', 'Everything you learn in the live sessions gets applied to your own project, in small pieces, every day.', 'You will hit problems. Solving them is the program.'],
  ['Test', 'Put it in front of real people.', 'Does it work on a phone? Can someone else use it without your help? Fix what breaks.', 'Testing is where beginners start to think like developers.'],
  ['Present', 'Show what you built on Day 30.', 'Explain the problem, the users, how it works, what you learned and how it could grow.', 'You submit a project package and present it.'],
];
export function ProjectBuilder() {
  const [i, setI] = useState(0);
  const p = PB[i];
  return (
    <div>
      <div className="flow" role="tablist" aria-label="From problem to presentation">
        {PB.map((x, n) => <button key={x[0]} role="tab" aria-selected={i === n} className="chip" onClick={() => setI(n)}><span className="no">{n + 1}</span>{x[0]}</button>)}
      </div>
      <div className="panel qa" role="tabpanel" key={i}>
        <div className="eyebrow" style={{ margin: 0 }}>Step {i + 1} of {PB.length}: {p[0]}</div>
        <h3>{p[1]}</h3>
        <p className="lead" style={{ margin: 0 }}>{p[2]}</p>
        <div className="ex"><b>Think of it like this</b>{p[3]}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-line sm" disabled={i === 0} onClick={() => setI(i - 1)}>← Back</button>
          <button className="btn btn-primary sm" disabled={i === PB.length - 1} onClick={() => setI(i + 1)}>Next →</button>
        </div>
      </div>
    </div>
  );
}

/* Device selector */
export function DeviceSelector() {
  const keys = Object.keys(DEVICES) as (keyof typeof DEVICES)[];
  const [k, setK] = useState<keyof typeof DEVICES>('Windows');
  return (
    <div>
      <div className="chips" role="group" aria-label="Choose a device" style={{ flexWrap: 'wrap', overflow: 'visible' }}>
        {keys.map((x) => <button key={x} className="chip" aria-pressed={k === x} onClick={() => setK(x)}>{x}</button>)}
      </div>
      <div className="panel" aria-live="polite" style={{ animation: 'rise .3s both' }} key={k}>
        <div className="eyebrow">{DEVICES[k].kind}: {k}</div>
        <p style={{ margin: 0, fontSize: '1.1rem' }}>{DEVICES[k].text}</p>
      </div>
      <p className="note" style={{ marginTop: 16 }}>The application asks what you actually have so the organizer understands the real technical environment of the cohort. It does not assume everyone owns a laptop.</p>
    </div>
  );
}

/* Delivery selector */
const DEL = [
  ['In person', 'Physical classroom-based participation.', 'May involve additional logistical costs. Venue to be determined by SHARIF TECHNOLOGIES.'],
  ['Remote', 'Live online participation.', 'Needs a reliable internet connection, power and a suitable place to work. Platform to be determined by SHARIF TECHNOLOGIES.'],
  ['Final arrangement', 'Decided by SHARIF TECHNOLOGIES after applications close.', 'It may be remote, in person or a combination, depending on the applicants and practical considerations. You state a preference; you do not choose.'],
];
export function DeliverySelector() {
  const [i, setI] = useState(2);
  return (
    <div>
      <div className="seg c3" role="group" aria-label="Delivery options">
        {DEL.map((d, n) => <button key={d[0]} aria-pressed={i === n} onClick={() => setI(n)}><b>{d[0]}</b><span>{d[1]}</span></button>)}
      </div>
      <div className="info amber" style={{ marginTop: 18 }} aria-live="polite" key={i}><b>{DEL[i][0]}</b><p>{DEL[i][2]}</p></div>
      <p style={{ fontWeight: 700 }}>Your class time is assigned by SHARIF TECHNOLOGIES.</p>
      <p className="note">Applicants may indicate their general availability during application, but the final timetable will be determined by SHARIF TECHNOLOGIES after the application period closes. We do not promise that every option will be available.</p>
    </div>
  );
}

/* Day 30 */
const D30 = ['The problem', 'The users', 'The solution', 'What you built', 'How it works', 'What you learned', 'What remains to improve', 'How it could scale', 'How you could benefit'];
export function Day30() {
  const [on, setOn] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setOn((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  return (
    <div>
      <p style={{ color: '#b8cbf3', marginBottom: 14 }}>Tap each item as you imagine yourself ready to explain it. <b style={{ color: '#fff' }}>{on.size} of {D30.length}</b> prepared.</p>
      <div className="progress-bar" aria-hidden><i style={{ width: `${(on.size / D30.length) * 100}%` }} /></div>
      <div className="present">
        {D30.map((t, i) => <button key={t} aria-pressed={on.has(i)} onClick={() => toggle(i)}><span aria-hidden>{on.has(i) ? '✓' : '○'}</span>{t}</button>)}
      </div>
    </div>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="faq">
      {FAQ.map(([q, a], i) => (
        <div className="item" key={q}>
          <h3 style={{ margin: 0 }}>
            <button aria-expanded={open === i} aria-controls={`fa-${i}`} id={`fq-${i}`} onClick={() => setOpen(open === i ? null : i)}>{q}<span className="pm" aria-hidden>+</span></button>
          </h3>
          <div className="body" data-open={open === i} id={`fa-${i}`} role="region" aria-labelledby={`fq-${i}`}><div><p>{a}</p></div></div>
        </div>
      ))}
    </div>
  );
}
