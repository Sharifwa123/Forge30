'use client';
import { Fragment, useRef, useState } from 'react';
import { DEVICES, FAQ, STAGES } from '@/lib/content';

/* Hero: the day ruler. 30 ticks = 30 days = 60 hours. Drag or tap to move through the programme. */
export function DayTracker() {
  const [d, setD] = useState(15);
  return (
    <div className="ruler tracker" role="group" aria-label="Explore the 30 days">
      <div className="read" aria-live="polite">
        <span>Day <b>{d}</b> of 30</span>
        <span><b>{d * 2}</b> of 60 hours</span>
        <em>{d === 30 ? 'Present' : ''}</em>
      </div>
      <input className="range" type="range" min={1} max={30} value={d} aria-label="Day of the programme" style={{ ['--p' as any]: `${((d - 1) / 29) * 100}%` }} onChange={(e) => setD(+e.target.value)} />
      <div className="ticks" aria-hidden><span>Day 1</span><span>Day 10</span><span>Day 20</span><span>Day 30 · Present</span></div>
      <p className="caption">{d === 30 ? 'Day 30: you submit your project package and present what you built.' : d === 1 ? 'Day 1: two live hours, then practice. Then you come back tomorrow.' : `Two live hours today, then independent practice. ${30 - d} days to go.`}</p>
    </div>
  );
}

/* The 30-day journey: an indexed timeline of programme areas */
export function Journey() {
  const [open, setOpen] = useState<number | null>(0);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (n: number) => btns.current[(n + STAGES.length) % STAGES.length]?.focus();
  return (
    <div>
      <ol className="index" aria-label="Programme areas">
        {STAGES.map((st, n) => (
          <li key={st.id}>
            <h3 style={{ margin: 0 }}>
              <button ref={(el) => { btns.current[n] = el; }} id={`st-${st.id}`} aria-expanded={open === n} aria-controls={`stp-${st.id}`}
                onClick={() => setOpen(open === n ? null : n)}
                onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); move(n + 1); } if (e.key === 'ArrowUp') { e.preventDefault(); move(n - 1); } }}>
                <span className="no">{String(n + 1).padStart(2, '0')}</span><span className="nm">{st.name}</span><span className="pm" aria-hidden>+</span>
              </button>
            </h3>
            <div className="body" data-open={open === n} id={`stp-${st.id}`} role="region" aria-labelledby={`st-${st.id}`}>
              <div><div className="inner"><p>{st.blurb}</p><ul>{st.items.map((t) => <li key={t}>{t}</li>)}</ul></div></div>
            </div>
          </li>
        ))}
      </ol>
      <p className="note" style={{ marginTop: 22 }}>These are programme areas, not a day-by-day syllabus. The exact sequence of topics is to be determined by SHARIF TECHNOLOGIES.</p>
    </div>
  );
}

/* Final project: PROBLEM → IDEA → SOLUTION → BUILD → TEST → PRESENT */
const PB = [
  ['Problem', 'Start with something real.', 'What annoys you or the people around you? Where do people waste time, money or effort?', 'Small shops in my area lose track of who owes them money.'],
  ['Idea', 'Turn it into a software idea.', 'What could a simple application do about it? It does not have to be clever. It has to be yours.', 'A simple app where a shop owner records customers and what they owe.'],
  ['Solution', 'Decide how it would work.', 'Who uses it, what do they do first, and what do they see? You will refine this during the program.', 'The owner logs in, adds a customer, records a debt, and sees a list of balances.'],
  ['Build', 'Build it, step by step, with guidance.', 'Everything you learn in the live sessions gets applied to your own project, in small pieces, every day.', 'You will hit problems. Solving them is the program.'],
  ['Test', 'Put it in front of real people.', 'Does it work on a phone? Can someone else use it without your help? Fix what breaks.', 'Testing is where beginners start to think like developers.'],
  ['Present', 'Show what you built on Day 30.', 'Explain the problem, the users, how it works, what you learned and how it could grow.', 'You submit a project package and present it.'],
];
export function ProjectBuilder() {
  const [i, setI] = useState(0);
  const p = PB[i];
  return (
    <div>
      <div className="flowline" role="tablist" aria-label="From problem to presentation">
        {PB.map((x, n) => (
          <Fragment key={x[0]}>
            <button role="tab" id={`pb-${n}`} aria-selected={i === n} aria-controls="pb-panel" onClick={() => setI(n)}>{x[0]}</button>
            {n < PB.length - 1 && <span className="sep" aria-hidden>→</span>}
          </Fragment>
        ))}
      </div>
      <div className="pstep" id="pb-panel" role="tabpanel" aria-labelledby={`pb-${i}`} key={i}>
        <div>
          <div className="eyebrow">Step {i + 1} of {PB.length}</div>
          <h3>{p[1]}</h3>
          <p style={{ margin: 0 }}>{p[2]}</p>
        </div>
        <div>
          <div className="ex"><b>Think of it like this</b>{p[3]}</div>
          <div className="pnav">
            <button className="btn btn-ghost sm" disabled={i === 0} onClick={() => setI(i - 1)}>← Back</button>
            <button className="btn btn-primary sm" disabled={i === PB.length - 1} onClick={() => setI(i + 1)}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Devices */
export function DeviceSelector() {
  const keys = Object.keys(DEVICES) as (keyof typeof DEVICES)[];
  const [k, setK] = useState<keyof typeof DEVICES>('Windows');
  return (
    <div>
      <div className="chips toggles" role="group" aria-label="Choose a device">
        {keys.map((x) => <button key={x} className="chip" aria-pressed={k === x} onClick={() => setK(x)}>{x}</button>)}
      </div>
      <div className="panel" aria-live="polite" style={{ animation: 'rise .3s both' }} key={k}>
        <div className="eyebrow">{DEVICES[k].kind} · {k}</div>
        <p style={{ margin: 0, fontSize: '1.08rem' }}>{DEVICES[k].text}</p>
      </div>
      <p className="note" style={{ marginTop: 16 }}>The application asks what you actually have so the organizer understands the real technical environment of the cohort. It does not assume everyone owns a laptop.</p>
    </div>
  );
}

/* Delivery */
const DEL = [
  ['In person', 'Physical classroom-based participation.', 'May involve additional logistical costs. Venue to be determined by SHARIF TECHNOLOGIES.'],
  ['Remote', 'Live online participation.', 'Needs a reliable internet connection, power and a suitable place to work. Platform to be determined by SHARIF TECHNOLOGIES.'],
];
export function DeliverySelector() {
  const [i, setI] = useState(0);
  return (
    <div>
      <div className="seg" role="group" aria-label="Delivery options" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {DEL.map((d, n) => <button key={d[0]} aria-pressed={i === n} onClick={() => setI(n)}><b>{d[0]}</b><span>{d[1]}</span></button>)}
      </div>
      <div className="info amber" style={{ marginTop: 14 }} aria-live="polite" key={i}><p style={{ margin: 0 }}>{DEL[i][2]}</p></div>
      <p className="note" style={{ margin: 0 }}>The final arrangement (remote, in person or a combination) and your class time are assigned by SHARIF TECHNOLOGIES after applications close. We do not promise that every option will be available.</p>
    </div>
  );
}

export function FormatAndDevices() {
  const [tab, setTab] = useState<'delivery' | 'devices'>('delivery');
  return (
    <div>
      <div className="chips" role="tablist" aria-label="Format and devices">
        {([['delivery', 'How we deliver'], ['devices', 'What you need']] as const).map(([k, l]) => <button key={k} role="tab" className="chip" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      <div role="tabpanel" key={tab} style={{ animation: 'rise .35s both' }}>{tab === 'delivery' ? <DeliverySelector /> : <DeviceSelector />}</div>
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
      <p style={{ color: 'var(--muted-dark)', marginBottom: 12 }}>On Day 30 you are ready to explain each of these. Tap to tick them off as you picture it. <b style={{ color: 'var(--on-dark)' }}>{on.size} of {D30.length}</b> prepared.</p>
      <div className="progress-bar" aria-hidden><i style={{ width: `${(on.size / D30.length) * 100}%` }} /></div>
      <div className="present">
        {D30.map((t, i) => <button key={t} aria-pressed={on.has(i)} onClick={() => toggle(i)}><i aria-hidden>{on.has(i) ? '✓' : ''}</i>{t}</button>)}
      </div>
    </div>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="faq">
      {FAQ.map(([q, a], i) => (
        <div className="item" key={q}>
          <h3>
            <button aria-expanded={open === i} aria-controls={`fa-${i}`} id={`fq-${i}`} onClick={() => setOpen(open === i ? null : i)}>{q}<span className="pm" aria-hidden>+</span></button>
          </h3>
          <div className="body" data-open={open === i} id={`fa-${i}`} role="region" aria-labelledby={`fq-${i}`}><div><p>{a}</p></div></div>
        </div>
      ))}
    </div>
  );
}
