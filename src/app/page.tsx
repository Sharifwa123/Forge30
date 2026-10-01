import Link from 'next/link';
import Header from '@/components/Header';
import Enhance from '@/components/Enhance';
import Footer from '@/components/Footer';
import { Day30, DayTracker, Faq, FormatAndDevices, Journey, ProjectBuilder } from '@/components/Interactive';
import { OrganizerCard } from '@/components/Dashboard';
import { getSettings, DEFAULTS } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const MODEL = [
  ['Learn', 'Live, instructor-led sessions.'],
  ['Practise', 'Independent practice between sessions.'],
  ['Solve', 'Practical assignments and problem-solving.'],
  ['Build', 'Your own project, step by step.'],
  ['Present', 'Show what you built on Day 30.'],
];

export default async function Home() {
  const s = await getSettings().catch(() => DEFAULTS);
  const open = s.applicationsOpen;
  const CTA = open ? 'APPLY FOR THE COHORT' : 'STUDENT DASHBOARD';

  return (
    <>
      <div className="scrollbar" aria-hidden />
      <Header open={open} />
      <main id="main">
        {(s.notice || s.announcements.length > 0) && (
          <div className="banner"><div className="wrap"><b>Notice: </b>{s.notice || s.announcements[0].text}</div></div>
        )}

        {/* ---------- Hero ---------- */}
        <section id="hero" className="hero">
          <div className="wrap">
            <div className="meta">
              <span>SHARIF TECHNOLOGIES · Developer programme</span>
              <span className="status"><i className={'dot' + (open ? '' : ' off')} aria-hidden />{open ? 'APPLICATIONS OPEN' : 'APPLICATIONS CLOSED'}</span>
            </div>
            <h1>FORGE<em>30</em></h1>
            <p className="sub">SHARIF TECHNOLOGIES Developer Program</p>
            <div className="grid-hero">
              <div>
                <p className="spec-line">30 DAYS · 60 HOURS · <span>BUILD FOR REAL</span></p>
                <p className="lead">An intensive, live developer program designed to take committed beginners from the fundamentals of computing and programming to building and presenting a real software project.</p>
                <div className="cta-row">
                  <Link href={open ? '/apply' : '/status'} className="btn btn-amber">{CTA} <span className="arrow">→</span></Link>
                  <a href="#how" className="btn btn-ghost">SEE HOW IT WORKS</a>
                </div>
                {!open && <p className="note" style={{ marginTop: 18 }}>Applications are closed for now. Submitted an application? Open your student dashboard for updates.</p>}
              </div>
              <DayTracker />
            </div>
          </div>
        </section>

        {/* ---------- 01 Programme ---------- */}
        <section id="program" className="tint">
          <div className="wrap split">
            <div className="rail" data-anim><b>01</b>Programme</div>
            <div>
              <div data-anim>
                <h2>A serious 30-day foundation for people who want to build.</h2>
                <p className="lead">A live, instructor-led program run by SHARIF TECHNOLOGIES. Zero experience required, but commitment is.</p>
                <p style={{ maxWidth: '62ch' }}>It is designed to develop practical foundational software-development ability through 60 hours of live instruction, practice and project work. Participants who successfully complete the program should leave with practical experience, greater confidence and a working foundation for continuing their development journey.</p>
              </div>
              <dl className="ledger" style={{ marginTop: 34 }} data-anim>
                <div><dt>Absolute beginners</dt><dd>You have never written code. You are willing to start from the fundamentals and be guided step by step.</dd></div>
                <div><dt>People who want to build</dt><dd>You have an idea or a problem you care about, and you want the skills to do something about it.</dd></div>
                <div><dt>People who can show up</dt><dd>You can give two hours live, every day, for 30 consecutive days, and practise in between.</dd></div>
              </dl>
            </div>
          </div>
        </section>

        {/* ---------- 02 How it works ---------- */}
        <section id="how" className="paper">
          <div className="wrap split">
            <div className="rail" data-anim><b>02</b>How it works</div>
            <div>
              <div className="hdgs" data-anim><h2>Learn. Practise. Solve. Build. Present.</h2></div>
              <ol className="model" data-anim>
                {MODEL.map(([n, d], i) => <li key={n}><b>0{i + 1}</b><strong>{n}</strong><span>{d}</span></li>)}
              </ol>
              <div id="journey" style={{ marginTop: 'clamp(40px, 6vw, 72px)' }}>
                <div className="hdgs" data-anim style={{ marginBottom: 22 }}><div className="eyebrow">The 30-day journey</div><h3 style={{ fontSize: 'clamp(1.5rem, 3.6vw, 2.2rem)', letterSpacing: '-.03em' }}>From the fundamentals to a real project.</h3></div>
                <div data-anim><Journey /></div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- 03 Commitment ---------- */}
        <section id="commitment" className="dark">
          <div className="wrap split">
            <div className="rail" data-anim><b>03</b>The commitment</div>
            <div>
              <div className="hdgs" data-anim>
                <h2>This is not a self-paced course.</h2>
                <p className="lead">FORGE30 is built around live participation. There are no recorded lessons provided as a substitute for attendance and no “learn whenever you have time” model.</p>
              </div>
              <dl className="spec" data-anim aria-label="Programme specification">
                <div><dt>Duration</dt><dd className="num">30<small>days</small></dd><dd className="txt">Consecutive days. If you join, you commit to the full 30.</dd></div>
                <div><dt>Total time</dt><dd className="num">60<small>hours</small></dd><dd className="txt">Of live instruction, practice and project work.</dd></div>
                <div><dt>Daily</dt><dd className="num">2<small>hours</small></dd><dd className="txt">A live two-hour session, every day.</dd></div>
                <div><dt>Format</dt><dd className="num">Live<small>& practical</small></dd><dd className="txt">Instructor-led, with practical assignments and independent practice.</dd></div>
                <div><dt>Output</dt><dd className="num">1<small>final project</small></dd><dd className="txt">Submitted and presented on Day 30.</dd></div>
              </dl>
              <div className="tags" data-anim>{['Attendance', 'Participation', 'Practice', 'Discipline', 'Project work'].map((t) => <span key={t}>{t}</span>)}</div>
              <div className="warn" style={{ marginTop: 26, maxWidth: 760 }} data-anim>
                <b className="mono" style={{ display: 'block', marginBottom: 6, letterSpacing: '.12em', fontSize: '.74rem', color: 'var(--accent)' }}>PROFESSIONAL EXPECTATIONS</b>
                <p style={{ margin: 0, color: 'var(--muted-dark)' }}>Participants are expected to attend their assigned sessions consistently. Unnecessary absence may result in dismissal. Misconduct, serious indiscipline, disruption, disrespect or deliberate violation of program rules may result in dismissal.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- 04 Final project ---------- */}
        <section id="project" className="darker">
          <div className="wrap split">
            <div className="rail" data-anim><b>04</b>Final project</div>
            <div>
              <div className="hdgs" data-anim>
                <h2>Don’t just learn. Build something that matters to you.</h2>
                <p className="lead">Start thinking about a software idea you genuinely care about. After you apply, you build your project proposal piece by piece in your student dashboard, all the way to Day 30.</p>
              </div>
              <div data-anim><ProjectBuilder /></div>
            </div>
          </div>
        </section>

        {/* ---------- 05 Format & programme information ---------- */}
        <section id="delivery" className="tint">
          <div className="wrap split">
            <div className="rail" data-anim><b>05</b>Format &amp; information</div>
            <div>
              <div className="hdgs" data-anim>
                <h2>You tell us your preference. SHARIF TECHNOLOGIES decides.</h2>
                <p className="lead">Your class time and the delivery arrangement are assigned by SHARIF TECHNOLOGIES after applications close.</p>
              </div>
              <div data-anim><FormatAndDevices /></div>
              <dl className="ledger" style={{ marginTop: 'clamp(36px, 5vw, 60px)' }} data-anim aria-label="Programme information">
                <div><dt>Selection</dt><dd>Submitting is an application. Applications are reviewed before the cohort is formed, and submission does not guarantee selection. Applications close when SHARIF TECHNOLOGIES is satisfied that enough have been received.</dd></div>
                <div><dt>Costs</dt><dd><p>No fixed course fee is published. An in-person arrangement may involve additional logistical costs; the application asks about them for planning only, and your answer does not affect your chance of selection.</p><p>Applicants should be prepared to arrange approximately GH₵500 for their own project-development needs. This is not a training fee or a payment to join, and we cannot guarantee it will be sufficient for every project.</p></dd></div>
                <div><dt>Certificate</dt><dd>A certificate of completion is associated with successfully completing the program requirements. It is never issued automatically because someone applied or registered.</dd></div>
                <div><dt>What we do not claim</dt><dd>FORGE30 makes no claim of accreditation, government, university or industry recognition, employment, or income. We also do not promise that every project becomes a commercial product; the goal is practical experience and something real that you made.</dd></div>
              </dl>
            </div>
          </div>
        </section>

        {/* ---------- 06 Day 30 ---------- */}
        <section id="day30" className="dark">
          <div className="wrap split">
            <div className="rail" data-anim><b>06</b>Day 30</div>
            <div className="grid g2" style={{ gap: 'clamp(28px, 5vw, 64px)', alignItems: 'start' }}>
              <div data-anim>
                <div className="big30" aria-hidden>30</div>
                <h2>Show what you built.</h2>
                <p className="lead">You submit a completed project package and present it. This is the culmination of the 30 days.</p>
              </div>
              <div data-anim><Day30 /></div>
            </div>
          </div>
        </section>

        {/* ---------- 07 Questions ---------- */}
        <section id="faq" className="paper">
          <div className="wrap split">
            <div className="rail" data-anim><b>07</b>Questions</div>
            <div>
              <div className="hdgs" data-anim><h2>Straight answers.</h2></div>
              <div data-anim><Faq /></div>
              <div style={{ marginTop: 'clamp(36px, 5vw, 60px)', maxWidth: 760 }} data-anim>
                <div className="eyebrow">Who runs FORGE30</div>
                <OrganizerCard o={s.organizer} />
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Final CTA ---------- */}
        <section id="final-cta" className="hero" style={{ paddingBottom: 'clamp(56px, 8vw, 96px)', paddingTop: 'clamp(56px, 8vw, 96px)' }}>
          <div className="wrap">
            <h2 data-anim style={{ fontSize: 'clamp(2.4rem, 8vw, 5.4rem)', letterSpacing: '-.04em', lineHeight: .95, maxWidth: '14ch' }}>Ready to build for real?</h2>
            <p className="spec-line" style={{ marginTop: 22 }}>30 DAYS. 60 HOURS. <span>ONE SERIOUS COMMITMENT.</span></p>
            <div className="cta-row"><Link href={open ? '/apply' : '/status'} className="btn btn-amber">{open ? 'APPLY FOR FORGE30' : 'STUDENT DASHBOARD'} <span className="arrow">→</span></Link></div>
            <p className="note" style={{ marginTop: 14 }}>Applications are reviewed before the cohort is formed. Submission does not guarantee selection.</p>
          </div>
        </section>
      </main>
      <Footer />
      <Enhance open={open} />
    </>
  );
}
