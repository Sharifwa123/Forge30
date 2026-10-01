import Link from 'next/link';
import Header from '@/components/Header';
import Enhance from '@/components/Enhance';
import Footer from '@/components/Footer';
import { CommitCounter, Day30, DayTracker, Faq, FormatAndDevices, Journey, ProjectBuilder } from '@/components/Interactive';
import { OrganizerCard } from '@/components/Dashboard';
import { getSettings, DEFAULTS, acceptingApplications } from '@/lib/settings';
import { NoticeStack, toItems } from '@/components/Notices';
import NoticePopup from '@/components/NoticePopup';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const s = await getSettings().catch(() => DEFAULTS);
  const open = (await acceptingApplications(s).catch(() => ({ open: s.applicationsOpen }))).open;
  const items = toItems(s);
  const CTA = open ? 'APPLY FOR THE COHORT' : 'STUDENT DASHBOARD';

  return (
    <>
      <div className="scrollbar" aria-hidden />
      <Header open={open} />
      <main id="main">
        <NoticeStack items={items} />
        <NoticePopup items={items} />

        <section id="hero" className="hero">
          <div className="wrap">
            <div>
              <h1>FORGE<em>30</em></h1>
              <div className="sub">SHARIF TECHNOLOGIES Developer Forge</div>
              <p className="tag">30 days. 60 hours. Build for real.</p>
              <p className="lead">An intensive, live developer program designed to take committed beginners from the fundamentals of computing and programming to building and presenting a real software project.</p>
              <div className="cta-row">
                <Link href={open ? '/apply' : '/status'} className="btn btn-primary">{CTA} <span className="arrow">→</span></Link>
                <a href="#program" className="btn btn-ghost">SEE HOW IT WORKS</a>
              </div>
              {!open && <p className="note" style={{ marginTop: 18 }}>Applications are closed for now. Submitted an application? Open your student dashboard for updates.</p>}
            </div>
            <DayTracker />
          </div>
        </section>

        <div className="stats"><div className="wrap">
          <div className="strip" role="list" data-anim="zoom">
            {[['30', 'Days'], ['60', 'Hours'], ['2', 'Hours / day'], ['Live', '& practical'], ['1', 'Final project']].map(([n, t]) => (
              <div className="s" role="listitem" key={t}><div className="n">{n}</div><div className="t">{t}</div></div>
            ))}
          </div>
        </div></div>

        <section id="program" className="tint">
          <div className="wrap grid g2" style={{ alignItems: 'center', gap: 36 }}>
            <div data-anim="fold">
              <div className="eyebrow">What FORGE30 is</div>
              <h2>A serious 30-day foundation for people who want to build.</h2>
              <p className="lead">A live, instructor-led program run by SHARIF TECHNOLOGIES. Zero experience required, but commitment is.</p>
              <p>It is designed to develop practical foundational software-development ability through 60 hours of live instruction, practice and project work. Participants who successfully complete the program should leave with practical experience, greater confidence and a working foundation for continuing their development journey.</p>
              <p className="note">No guarantee of a job, accreditation or income.</p>
            </div>
            <div data-anim="flip" className="method" aria-label="The method">
              <div className="eyebrow" style={{ color: 'var(--amber)', width: '100%' }}>The method</div>
              {['Learn', 'Practise', 'Solve', 'Build', 'Present'].map((w, i) => <div key={w}><span>0{i + 1}</span>{w}</div>)}
            </div>
          </div>
        </section>

        <section id="journey" className="dark">
          <div className="wrap">
            <div className="hdgs" data-anim="fold"><div className="eyebrow">The 30-day journey</div><h2>From the fundamentals to a real project.</h2>
              <p className="lead">Tap a stage to see what you will encounter.</p></div>
            <div data-anim="rise"><Journey /></div>
          </div>
        </section>

        <section id="commitment" className="blue">
          <div className="wrap grid g2" style={{ gap: 36, alignItems: 'start' }}>
            <div data-anim="left">
              <div className="eyebrow">The live practical model</div>
              <h2>This is not a self-paced course.</h2>
              <p className="lead">FORGE30 is built around live participation. There are no recorded lessons provided as a substitute for attendance and no “learn whenever you have time” model.</p>
              <p style={{ fontWeight: 700, fontSize: '1.15rem' }}>If you join, you commit: a daily two-hour session for the full 30 days.</p>
              <div className="tags">{['Attendance', 'Participation', 'Practice', 'Discipline', 'Project work'].map((t) => <span key={t}>✓ {t}</span>)}</div>
              <div className="warn" style={{ marginTop: 20 }}>
                <b style={{ display: 'block', marginBottom: 6, letterSpacing: '.08em' }}>PROFESSIONAL EXPECTATIONS</b>
                <p style={{ margin: 0 }}>Participants are expected to attend their assigned sessions consistently. Unnecessary absence may result in dismissal. Misconduct, serious indiscipline, disruption, disrespect or deliberate violation of program rules may result in dismissal.</p>
              </div>
            </div>
            <div data-anim="right"><h3 style={{ fontSize: '1.3rem' }}>See what 30 days looks like</h3><CommitCounter /></div>
          </div>
        </section>

        <section id="delivery" className="paper">
          <div className="wrap grid g2" style={{ gap: 36, alignItems: 'start' }}>
            <div data-anim="left"><div className="eyebrow">How will we learn?</div><h2>You tell us your preference. SHARIF TECHNOLOGIES decides.</h2>
              <p className="lead">Your class time and the delivery arrangement are assigned by SHARIF TECHNOLOGIES after applications close.</p></div>
            <div data-anim="right"><FormatAndDevices /></div>
          </div>
        </section>

        <section id="project" className="dark">
          <div className="wrap">
            <div className="hdgs" data-anim="fold"><div className="eyebrow">The final project</div><h2>Don’t just learn. Build something that matters to you.</h2>
              <p className="lead">Start thinking about a software idea you genuinely care about. After you apply, you build your project proposal piece by piece in your student dashboard, all the way to Day 30.</p></div>
            <div data-anim="rise"><ProjectBuilder /></div>
            <div className="info amber" data-anim="rise" style={{ marginTop: 28, marginBottom: 0, color: 'var(--ink)' }}><b>Project budget, not a training fee</b><p>Applicants should be prepared to arrange approximately GH₵500 for their project-development needs. It is not a payment to join, and we cannot guarantee it will be sufficient for every project. An in-person arrangement may also involve additional logistical costs; the application asks about them for planning only.</p></div>
          </div>
        </section>

        <section id="day30" className="darker">
          <div className="wrap day30 grid g2" style={{ gap: 36, alignItems: 'center' }}>
            <div data-anim="left">
              <div className="big" aria-hidden>30</div>
              <div className="eyebrow">Day 30</div>
              <h2>Show what you built.</h2>
              <p className="lead">You submit a completed project package and present it. This is the culmination of the 30 days.</p>
              <p className="note">Not every project becomes a commercial product; the goal is practical experience and something real. A certificate of completion is associated with successfully completing the program requirements, and is never automatic.</p>
            </div>
            <div data-anim="right"><Day30 /></div>
          </div>
        </section>

        <section id="organizer" className="tint" style={{ paddingBlock: 36 }}>
          <div className="wrap grid g2" style={{ gap: 28, alignItems: 'center' }}>
            <div data-anim="fold"><div className="eyebrow">Who runs FORGE30</div><h2 style={{ marginBottom: 0 }}>Questions before you apply?</h2></div>
            <div data-anim="flip"><OrganizerCard o={s.organizer} /></div>
          </div>
        </section>

        <section id="faq" className="paper">
          <div className="wrap"><div className="hdgs" data-anim="fold"><div className="eyebrow">Questions</div><h2>Straight answers.</h2></div><div data-anim="rise"><Faq /></div></div>
        </section>

        <section id="final-cta" className="hero" style={{ paddingBottom: 70 }}>
          <div className="wrap" style={{ gridTemplateColumns: '1fr' }}>
            <h2 data-anim="zoom" style={{ fontSize: 'clamp(2.2rem,7vw,4.2rem)' }}>Ready to build for real?</h2>
            <p className="tag">30 days. 60 hours. One serious commitment.</p>
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
