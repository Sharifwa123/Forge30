import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StatusForm from '@/components/StatusForm';
import { getSettings, DEFAULTS } from '@/lib/settings';
export const metadata: Metadata = { title: 'Check application status', alternates: { canonical: '/status' } };
export const dynamic = 'force-dynamic';

export default async function Status() {
  const s = await getSettings().catch(() => DEFAULTS);
  return (
    <>
      <Header open={s.applicationsOpen} />
      <main id="main" className="tint" style={{ padding: '56px 0 80px' }}>
        <div className="wrap" style={{ maxWidth: 640 }}>
          <div className="eyebrow">Applicants</div>
          <h1 style={{ fontSize: 'clamp(2rem,6vw,3rem)' }}>Check your application status</h1>
          <p className="lead">Enter the reference code you received when you submitted, and the email address you applied with.</p>
          <StatusForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
