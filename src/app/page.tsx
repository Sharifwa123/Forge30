import Link from 'next/link';
import Chevron from '@/components/Chevron';
import { WhatsAppChat } from '@/components/Interest';
import Explorer from '@/components/Explorer';
import Logo from '@/components/Logo';
import Header from '@/components/Header';
import Enhance from '@/components/Enhance';
import Footer from '@/components/Footer';
import { getSettings, DEFAULTS, acceptingApplications } from '@/lib/settings';
import { NoticeStack, toItems } from '@/components/Notices';
import NoticePopup from '@/components/NoticePopup';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const s = await getSettings().catch(() => DEFAULTS);
  const open = (await acceptingApplications(s).catch(() => ({ open: s.applicationsOpen }))).open;
  const items = toItems(s);
  const CTA = open ? 'APPLY NOW' : 'STUDENT DASHBOARD';

  return (
    <>
      <div className="scrollbar" aria-hidden />
      <Header open={open} />
      <main id="main">
        <NoticeStack items={items} />
        <NoticePopup items={items} />

        <section id="hero" className="hero hero-s">
          <div className="wrap">
            <div className="hero-row">
              <Logo size={96} className="hero-logo" priority />
              <div>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '.25em' }}><Chevron width={52} className="h1-chev" /><span>FORGE<em>30</em></span></h1>
                <div className="sub">SHARIF TECHNOLOGIES Skills Forge</div>
              </div>
            </div>
            <p className="tag">30 days. 60 hours. Build for real.</p>
            <p className="lead">An intensive, live program in computer skills and software development for committed learners starting from zero. You finish with a real project you present.</p>
            <div className="cta-row">
              <Link href={open ? '/apply' : '/status'} className="btn btn-primary">{CTA} <span className="arrow">→</span></Link>
              <a href="#what" className="btn btn-ghost">HOW IT WORKS</a>
              <WhatsAppChat number={s.organizer.whatsapp} />
            </div>
            {!open && <p className="note" style={{ marginTop: 14 }}>Applications are closed for now. Submitted an application? Open your student dashboard for updates.</p>}
            <p className="note hero-int"><a href="#join">Not ready to apply yet? Leave your WhatsApp number →</a></p>
          </div>
        </section>

        <Explorer open={open} whatsapp={s.organizer.whatsapp} organizerName={s.organizer.name} organizerTitle={s.organizer.title} />
      </main>
      <Footer />
      <Enhance open={open} />
    </>
  );
}
