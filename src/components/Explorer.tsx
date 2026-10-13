'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { track } from '@/lib/track';
import { GROUP_NAME, LEVELS, groupFor } from '@/lib/levels';
import { CommitCounter, Faq, ProjectBuilder } from './Interactive';
import InterestForm, { WhatsAppChat } from './Interest';
import GroupJoin from './GroupJoin';

const CARDS = [
  ['what', 'What is it?'],
  ['path', 'Choose your path'],
  ['how', 'How it works'],
  ['project', 'Your project'],
  ['faq', 'Straight answers'],
  ['join', 'Join'],
] as const;

const STATS = [
  ['30', 'days', 'A month of live classes, every day for 30 days in a row.'],
  ['60', 'hours', 'Two hours a day, 30 days: live teaching, practice and project work.'],
  ['2', 'hours a day', 'A live session at your assigned time. SHARIF TECHNOLOGIES sets it; you do not choose it.'],
  ['1', 'final project', 'You build it bit by bit and present it on Day 30.'],
] as const;

const METHOD = [
  ['Learn', 'New ideas explained live by your instructor.'],
  ['Practise', 'You try it yourself straight away.'],
  ['Solve', 'Small problems to work through, with help.'],
  ['Build', 'You apply it to your own project, a little every day.'],
  ['Present', 'You show what you made on Day 30.'],
] as const;

type Goal = 'skills' | 'dev' | 'unsure';
const PATHS: Record<Goal, { icon: string; name: string; sub: string; learn: string; finish: string }> = {
  skills: { icon: '💻', name: 'Computer skills', sub: 'Get confident using computers', learn: 'Using a computer with confidence: typing and files, the internet and email, documents, spreadsheets, presentations and staying safe online. Exact topics are confirmed by SHARIF TECHNOLOGIES for each group.', finish: 'A practical digital project of your choice (for example a spreadsheet, a presentation or a simple website), presented on Day 30.' },
  dev: { icon: '🧑‍💻', name: 'Software development', sub: 'Learn to build software', learn: 'How software is built: the web, programming, simple back-end logic, data, version control and putting your work online. You can start from zero.', finish: 'A real software project you build and present on Day 30.' },
  unsure: { icon: '🤔', name: 'Not sure yet', sub: 'That is fine', learn: 'Choose “Not sure yet” in the application and we will help you decide.', finish: 'A real project, presented on Day 30.' },
};

export default function Explorer({ open, whatsapp, organizerName, organizerTitle, groupUrl = '', groupLabel = '' }: { groupUrl?: string; groupLabel?: string; open: boolean; whatsapp: string; organizerName: string; organizerTitle: string }) {
  const [i, setI] = useState(0);
  const [stat, setStat] = useState<number | null>(null);
  const [method, setMethod] = useState(0);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null); const sent = useRef(false); const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((n: number, scroll = true) => {
    const k = Math.max(0, Math.min(CARDS.length - 1, n)); setI(k);
    if (k > 0 && !sent.current) { sent.current = true; track('details_viewed'); }
    if (scroll) requestAnimationFrame(() => root.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  }, []);

  // Deep links from the menu: /#path, /#project, /#faq …
  useEffect(() => {
    const read = () => { const k = CARDS.findIndex((c) => c[0] === location.hash.slice(1)); if (k >= 0) go(k); };
    read(); window.addEventListener('hashchange', read); return () => window.removeEventListener('hashchange', read);
  }, [go]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (!(e.target instanceof HTMLElement) || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.key === 'ArrowRight') go(i + 1, false); if (e.key === 'ArrowLeft') go(i - 1, false); };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [i, go]);

  const onStart = (e: React.TouchEvent) => { const t = e.target as HTMLElement; touch.current = t.closest('input,textarea,select,[role=slider],.days') ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onEnd = (e: React.TouchEvent) => { const s = touch.current; touch.current = null; if (!s) return; const dx = e.changedTouches[0].clientX - s.x, dy = e.changedTouches[0].clientY - s.y; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) go(i + (dx < 0 ? 1 : -1), false); };

  const g = goal ? PATHS[goal] : null; const grp = level ? groupFor(level) : null;
  const applyHref = `/apply${goal ? `?goal=${goal}${level ? `&level=${level}` : ''}` : ''}`;

  return (
    <section id="explore" ref={root} className="xplr" aria-label="Explore FORGE30" aria-roledescription="carousel" onTouchStart={onStart} onTouchEnd={onEnd}>
      <div className="ex-card">
        <div className="ex-top">
          <div className="ex-bars" role="tablist" aria-label="Sections">
            {CARDS.map(([id, name], n) => <button key={id} role="tab" aria-selected={i === n} aria-label={`${n + 1} of ${CARDS.length}: ${name}`} className={n <= i ? 'on' : ''} onClick={() => go(n, false)} />)}
          </div>
          <div className="ex-title" aria-live="polite"><span>{i + 1}/{CARDS.length}</span> {CARDS[i][1]}</div>
        </div>

        {/* All cards stay in the page (hidden when inactive) so search engines and screen readers can still read them. */}
        <div className="ex-panel" id="what" role="tabpanel" hidden={i !== 0} data-card="what">
          <h2>A live program that teaches you real skills in 30 days.</h2>
          <p className="lead">FORGE30 by SHARIF TECHNOLOGIES: computer skills <b>and</b> software development, for committed beginners. Complete beginners are welcome. No experience needed, just commitment. Tap a number:</p>
          <div className="ex-stats">
            {STATS.map(([n, t], k) => <button key={t} className={stat === k ? 'on' : ''} aria-pressed={stat === k} onClick={() => setStat(stat === k ? null : k)}><b>{n}</b><span>{t}</span></button>)}
          </div>
          <p className="ex-say" aria-live="polite">{stat === null ? 'Classes have a maximum of 15 people.' : STATS[stat][2]}</p>
        </div>

        <div className="ex-panel" id="path" role="tabpanel" hidden={i !== 1} data-card="path">
          <h2>Choose your path</h2>
          <div className="ex-paths" role="group" aria-label="What do you want from FORGE30?">
            {(Object.keys(PATHS) as Goal[]).map((k) => <button key={k} className={goal === k ? 'on' : ''} aria-pressed={goal === k} onClick={() => setGoal(k)}><span aria-hidden>{PATHS[k].icon}</span><b>{PATHS[k].name}</b><small>{PATHS[k].sub}</small></button>)}
          </div>
          {goal === 'skills' && <p className="ex-note"><b>Nothing developer-related is taught on this path.</b> Want to be a developer instead? Choose Software development.</p>}
          {goal === 'dev' && <p className="ex-note"><b>Starting from zero is fine.</b> If you have no computer skills, choose <b>Beginner</b> as your level below. Do not choose “Computer skills”.</p>}
          {goal && (<>
            <h3>Your current level</h3>
            <div className="ex-levels" role="group" aria-label="Your computer skills level">
              {LEVELS.map((l) => <button key={l.v} className={level === l.v ? 'on' : ''} aria-pressed={level === l.v} onClick={() => setLevel(l.v)}><b>{l.name}</b><small>{l.hint}</small></button>)}
            </div>
          </>)}
          {g && (
            <div className="ex-result" aria-live="polite">
              <p><b>You would learn:</b> {g.learn}</p>
              <p><b>You would finish with:</b> {g.finish}</p>
              {grp && <p><b>Your group:</b> {grp} · {GROUP_NAME[grp]}</p>}
              {open ? <Link className="btn btn-amber" href={applyHref}>APPLY WITH THESE CHOICES <span className="arrow">→</span></Link> : <p className="note">Applications are closed for now. Leave your WhatsApp number on the last card.</p>}
            </div>
          )}
          <p className="note ex-static" hidden={!!goal}>You are placed in a group by your level: LCS, ICS or ACS (Low, Intermediate or Advanced Computer Skills). If you choose Computer skills, nothing developer-related is taught. If you want to be a developer but have no computer skills, choose Software development and select Beginner, not Computer skills.</p>
        </div>

        <div className="ex-panel" id="how" role="tabpanel" hidden={i !== 2} data-card="how">
          <h2>How every session works</h2>
          <div className="ex-method" role="group" aria-label="The method">
            {METHOD.map(([w], k) => <button key={w} className={method === k ? 'on' : ''} aria-pressed={method === k} onClick={() => setMethod(k)}><span>0{k + 1}</span>{w}</button>)}
          </div>
          <p className="ex-say" aria-live="polite">{METHOD[method][1]}</p>
          <h3>See what 30 days looks like</h3>
          <div className="dark ex-dark" id="commitment"><CommitCounter /></div>
          <p className="note">It is live. There are no recordings to catch up on. Unnecessary absence may result in dismissal, and so may misconduct or breaking program rules.</p>
        </div>

        <div className="ex-panel" id="project" role="tabpanel" hidden={i !== 3} data-card="project">
          <h2>Make something that matters to you</h2>
          <p className="lead">Everyone finishes with a project: software, or a practical digital project on the computer-skills path. You build it bit by bit in your student dashboard until Day 30.</p>
          <div className="dark ex-dark"><ProjectBuilder /></div>
        </div>

        <div className="ex-panel" id="faq" role="tabpanel" hidden={i !== 4} data-card="faq">
          <h2>Straight answers</h2>
          <Faq />
          <p className="note" style={{ marginTop: 12 }}>No guarantee of a job, accreditation or income. Applications are reviewed first, and selection is not guaranteed.</p>
        </div>

        <div className="ex-panel" id="join" role="tabpanel" hidden={i !== 5} data-card="join">
          <h2>{open ? 'Ready to join?' : 'Applications are closed for now'}</h2>
          {open ? <Link className="btn btn-amber ex-big" href={applyHref}>APPLY FOR FORGE30 <span className="arrow">→</span></Link> : <Link className="btn btn-line ex-big" href="/status">STUDENT DASHBOARD</Link>}
          {groupUrl && <p style={{ margin: '12px 0 0' }}><GroupJoin url={groupUrl} label={groupLabel} className="ex-big" /></p>}
          <p className="note">Takes a few minutes. Your answers save as you go. There is no joining fee.</p>
          <h3 id="interest">Not sure yet? Leave your WhatsApp number.</h3>
          <p style={{ marginTop: 0 }}>No application, no commitment. We will explain everything.</p>
          <InterestForm open={open} />
          {whatsapp && <p style={{ margin: '12px 0 0' }}>Prefer to talk now? <WhatsAppChat number={whatsapp} className="btn btn-line sm" label="CHAT ON WHATSAPP" /></p>}
          <p className="note" style={{ marginTop: 12 }}>Run by {organizerName}{organizerTitle ? `, ${organizerTitle}` : ''}.</p>
        </div>

        <div className="ex-nav">
          <button className="btn btn-line" onClick={() => go(i - 1)} disabled={i === 0}>← Back</button>
          {i < CARDS.length - 1 ? <button className="btn btn-primary" onClick={() => go(i + 1)}>{i === 0 ? 'Show me' : 'Next'} →</button> : (open ? <Link className="btn btn-primary" href={applyHref}>APPLY →</Link> : <span />)}
        </div>
      </div>
    </section>
  );
}
