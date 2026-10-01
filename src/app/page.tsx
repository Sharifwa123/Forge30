import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Enhance from '@/components/Enhance';
import Footer from '@/components/Footer';
import { CommitCounter, Day30, DayTracker, DeliverySelector, DeviceSelector, Faq, Journey, ProjectBuilder } from '@/components/Interactive';
import { getSettings, DEFAULTS } from '@/lib/settings';
import { OrganizerCard } from '@/components/Dashboard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const s = await getSettings().catch(() => DEFAULTS);
  const open = s.applicationsOpen;
  const CTA = open ? 'APPLY FOR THE COHORT' : 'STUDENT DASHBOARD';

  return (
    <>
      <Header open={open} />
      <main id="main">
        {(s.notice || s.announcements.length > 0) && (
          <div className="banner"><div className="wrap"><b>Notice: </b>{s.notice || s.announcements[0].text}</div></div>
        )}

        <section id="hero" className="hero">
          <div className="wrap">
            <div>
              <div className="badge"><span className={'dot' + (open ? '' : ' off')} aria-hidden /> {open ? 'APPLICATIONS OPEN' : 'APPLICATIONS CLOSED'}</div>
              <h1>FORGE<em>30</em></h1>
              <div className="sub">SHARIF TECHNOLOGIES Developer Forge</div>
              <p className="tag">30 days. 60 hours. Build for real.</p>
              <p className="lead">An intensive, live developer program designed to take committed beginners from the fundamentals of computing and programming to building and presenting a real software project.</p>
              <div className="cta-row">
                <Link href={open ? '/apply' : '/status'} className="btn btn-primary">{CTA} <span className="arrow">→</span></Link>
                <a href="#program" className="btn btn-ghost">SEE HOW IT WORKS</a>
              </div>
              {!open && <p className="note" style={{ marginTop: 18 }}>Applications are closed for now. You can still check the status of an application you have submitted.</p>}
            </div>
            <DayTracker />
          </div>
        </section>

        <div className="stats"><div className="wrap">
          <div className="strip" role="list">
            {[['30', 'Days'], ['60', 'Hours'], ['2', 'Hours / day'], ['Live', '& practical'], ['1', 'Final project']].map(([n, t]) => (
              <div className="s" role="listitem" key={t}><div className="n">{n}</div><div className="t">{t}</div></div>
            ))}
          </div>
        </div></div>

        <section id="program" className="tint">
          <div className="wrap grid g2" style={{ alignItems: 'center', gap: 48 }}>
            <div className="rv">
              <div className="eyebrow">What FORGE30 is</div>
              <h2>A serious 30-day foundation for people who want to build.</h2>
              <p className="lead">FORGE30 is a live, instructor-led developer program run by SHARIF TECHNOLOGIES. Over 60 hours you learn, practise, solve problems and build, then present what you made.</p>
              <p>It is designed to develop practical foundational software-development ability through 60 hours of live instruction, practice and project work. Participants who successfully complete the program should leave with practical experience, greater confidence and a working foundation for continuing their development journey.</p>
              <p className="note">We do not claim it turns anyone into a senior engineer in 30 days, and we do not guarantee a job, accreditation or income.</p>
            </div>
            <div className="rv panel" style={{ background: 'var(--navy-900)', color: '#fff', borderColor: 'var(--navy-900)', padding: 32 }}>
              <div className="eyebrow" style={{ color: 'var(--amber)' }}>The method</div>
              <div style={{ display: 'grid', gap: 0 }}>
                {['Learn', 'Practise', 'Solve', 'Build', 'Present'].map((w, i) => (
                  <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderTop: i ? '1px solid var(--line-dark)' : 0 }}>
                    <span style={{ color: 'var(--amber)', fontWeight: 800, width: 28 }}>0{i + 1}</span>
                    <span style={{ fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 800, letterSpacing: '-.02em' }}>{w}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="paper">
          <div className="wrap">
            <div className="hdgs rv"><div className="eyebrow">Who it is for</div><h2>Committed beginners. Zero experience required.</h2>
              <p className="lead">You can start with no programming knowledge, no web-development knowledge and very limited computer experience. What you cannot start without is commitment.</p></div>
            <div className="grid g3">
              {[['Absolute beginners', 'You have never written code. You are willing to start from the fundamentals and be guided step by step.'], ['People who want to build', 'You have an idea or a problem you care about, and you want the skills to do something about it.'], ['People who can show up', 'You can give two hours live, every day, for 30 consecutive days, and practise in between.']].map(([t, d]) => (
                <div className="panel rv" key={t}><h3>{t}</h3><p style={{ margin: 0, color: 'var(--muted)' }}>{d}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section id="journey" className="dark">
          <div className="wrap">
            <div className="hdgs rv"><div className="eyebrow">The 30-day journey</div><h2>From the fundamentals to a real project.</h2>
              <p className="lead">Tap a stage to see what you will encounter. Use the arrow keys, swipe, or the buttons.</p></div>
            <Journey />
          </div>
        </section>

        <section className="tint" id="learn">
          <div className="wrap">
            <div className="hdgs rv"><div className="eyebrow">What you will learn</div><h2>Practical skills, in the order real projects need them.</h2></div>
            <div className="grid g4">
              {[['Web fundamentals', 'How websites are built and how they reach people.'], ['Programming', 'Thinking logically and writing code that solves problems.'], ['Applications and data', 'Making software that responds, stores and protects information.'], ['Professional workflow', 'Version control, testing, and putting your work online.']].map(([t, d]) => (
                <div className="panel rv" key={t} style={{ borderTop: '4px solid var(--brand)' }}><h3>{t}</h3><p style={{ margin: 0, color: 'var(--muted)' }}>{d}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section className="paper">
          <div className="wrap grid g2" style={{ gap: 48, alignItems: 'start' }}>
            <div className="rv">
              <div className="eyebrow">The live practical model</div>
              <h2>This is not a self-paced course.</h2>
              <p className="lead">FORGE30 is built around live participation. There are no recorded lessons provided as a substitute for attendance and no “learn whenever you have time” model.</p>
              <p style={{ fontWeight: 700, fontSize: '1.15rem' }}>You commit to a daily two-hour session for the full 30 days.</p>
            </div>
            <div className="grid rv">
              {[['Attendance matters', 'Learning is cumulative. Each day builds on the last.'], ['Participation matters', 'You learn by doing, asking and being seen working.'], ['Practice matters', 'The live session starts the learning. Practice makes it yours.'], ['Discipline matters', 'Showing up when it is hard is part of becoming a developer.'], ['Project work matters', 'Everything you learn is applied to something you care about.']].map(([t, d]) => (
                <div key={t} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--line)' }}><b style={{ color: 'var(--brand)', minWidth: 28 }}>✓</b><div><b>{t}</b><div style={{ color: 'var(--muted)' }}>{d}</div></div></div>
              ))}
            </div>
          </div>
        </section>

        <section id="commitment" className="blue">
          <div className="wrap">
            <div className="hdgs rv"><div className="eyebrow">Commitment &amp; discipline</div><h2>If you join, you commit.</h2></div>
            <div className="commit-grid rv">
              {['30 consecutive days', '2 hours every day', '60 total hours', 'Live participation', 'Practical assignments', 'Independent practice', 'Final project', 'Final presentation'].map((t) => (
                <div className="panel" key={t}><span className="ic" aria-hidden>▸</span>{t}</div>
              ))}
            </div>
            <div className="grid g2" style={{ marginTop: 40, gap: 40, alignItems: 'start' }}>
              <div className="rv"><h3 style={{ fontSize: '1.4rem' }}>See what 30 days looks like</h3><CommitCounter /></div>
              <div className="warn rv">
                <b style={{ display: 'block', marginBottom: 8, letterSpacing: '.08em' }}>PROFESSIONAL EXPECTATIONS</b>
                <p>Participants are expected to attend their assigned sessions consistently. Unnecessary absence may result in dismissal. Misconduct, serious indiscipline, disruption, disrespect or deliberate violation of program rules may result in dismissal.</p>
                <p style={{ margin: 0 }}>These expectations exist to protect the quality of the cohort for everyone in it.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="delivery" className="paper">
          <div className="wrap grid g2" style={{ gap: 48, alignItems: 'start' }}>
            <div className="rv"><div className="eyebrow">Devices &amp; access</div><h2>What do you have to work with?</h2><p className="lead">We ask honestly about your equipment. Pick a device to see what it means for you.</p><DeviceSelector /></div>
            <div className="rv"><div className="eyebrow">How will we learn?</div><h2>Delivery is decided by SHARIF TECHNOLOGIES.</h2><p className="lead">You can tell us what you prefer. The organizer decides.</p><DeliverySelector /></div>
          </div>
        </section>

        <section id="project" className="dark">
          <div className="wrap">
            <div className="hdgs rv"><div className="eyebrow">The final project</div><h2>Don’t just learn. Build something that matters to you.</h2>
              <p className="lead">Before the program begins, start thinking about a software idea you genuinely care about. Your final project is based on your own idea or a real problem you want to solve. Step through how an idea becomes a presentation:</p></div>
            <div className="rv"><ProjectBuilder /></div>
            <div className="grid g4 rv" style={{ marginTop: 40 }}>
              {[['The idea', 'What do you want to build?'], ['The problem', 'What problem does it solve?'], ['The users', 'Who will use it?'], ['The benefit', 'What value does it provide?'], ['The solution', 'How will the software address the problem?'], ['The future', 'How could it grow or scale?'], ['The sustainability', 'How could you benefit from it?'], ['The budget', 'Approximately GH₵500 for project needs']].map(([t, d]) => (
                <div className="panel" key={t}><b style={{ color: 'var(--amber)', display: 'block', letterSpacing: '.06em', fontSize: '.8rem', textTransform: 'uppercase' }}>{t}</b><span style={{ color: '#d6e1fa' }}>{d}</span></div>
              ))}
            </div>
          </div>
        </section>

        <section id="budget" className="tint">
          <div className="wrap grid g2" style={{ gap: 48, alignItems: 'center' }}>
            <div className="rv">
              <div className="eyebrow">Project budget</div>
              <h2>Be prepared to arrange about GH₵500 for your project.</h2>
              <p className="lead">Applicants should be prepared to arrange approximately GH₵500 for their project-development needs.</p>
            </div>
            <div className="panel rv">
              <div className="info amber"><b>This is not a training fee.</b><p>It is not payment to join. It is a project-development budget for expenses connected to your own project, such as things it may need to run or be published. The exact use depends on the project, and we cannot guarantee that GH₵500 will be enough for every project.</p></div>
              <div className="info blue" style={{ marginBottom: 0 }}><b>In-person cost disclosure</b><p>An in-person arrangement may involve additional logistical costs. The application asks how you would feel about contributing toward them, for planning only. Your answer does not affect your chance of selection.</p></div>
            </div>
          </div>
        </section>

        <section id="day30" className="darker">
          <div className="wrap day30 grid g2" style={{ gap: 48, alignItems: 'center' }}>
            <div className="rv">
              <div className="big" aria-hidden>30</div>
              <div className="eyebrow">Day 30</div>
              <h2>Show what you built.</h2>
              <p className="lead">You submit a completed project package and present it. This is the culmination of the 30 days.</p>
              <p className="note">We do not promise that every project becomes a commercially successful product. The goal is practical development experience and something real that you made.</p>
            </div>
            <div className="rv"><Day30 /></div>
          </div>
        </section>

        <section id="certificate" className="paper">
          <div className="wrap grid g2" style={{ gap: 48, alignItems: 'center' }}>
            <div className="rv"><div className="eyebrow">Certificate</div><h2>Completion is earned.</h2></div>
            <div className="rv"><p className="lead">The application asks whether you would like to receive a certificate of completion if you successfully complete the program.</p>
              <p>Certificates are associated with successful completion of the program requirements and are not automatically issued simply because someone registered. FORGE30 is not claimed to be accredited or recognised by any government, university or industry body.</p></div>
          </div>
        </section>

        <section id="organizer" className="darker">
          <div className="wrap grid g2" style={{ gap: 40, alignItems: 'center' }}>
            <div className="rv"><div className="eyebrow">Who runs FORGE30</div><h2>Built by the people behind SHARIF TECHNOLOGIES.</h2><p className="lead">Questions before you apply? Reach out using the details here.</p></div>
            <div className="rv"><OrganizerCard o={s.organizer} dark /></div>
          </div>
        </section>

        <section id="faq" className="tint">
          <div className="wrap"><div className="hdgs rv"><div className="eyebrow">Questions</div><h2>Straight answers.</h2></div><div className="rv"><Faq /></div></div>
        </section>

        <section id="final-cta" className="hero" style={{ paddingBottom: 90 }}>
          <div className="wrap" style={{ gridTemplateColumns: '1fr', textAlign: 'left' }}>
            <div className="eyebrow" style={{ color: 'var(--amber)' }}>The next step</div>
            <h2 style={{ fontSize: 'clamp(2.2rem,7vw,4.4rem)' }}>Ready to build for real?</h2>
            <p className="tag">30 days. 60 hours. One serious commitment.</p>
            <div className="cta-row"><Link href={open ? '/apply' : '/status'} className="btn btn-amber">{open ? 'APPLY FOR FORGE30' : 'STUDENT DASHBOARD'} <span className="arrow">→</span></Link></div>
            <p className="note" style={{ marginTop: 16 }}>Applications are reviewed before the cohort is formed. Submission does not guarantee selection.</p>
          </div>
        </section>
      </main>
      <Footer />
      <Enhance open={open} />
    </>
  );
}
