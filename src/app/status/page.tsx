import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StatusForm from '@/components/StatusForm';
import { redirect } from 'next/navigation';
import { q } from '@/lib/db';
import { getStudentRef } from '@/lib/student';
import { getSettings, DEFAULTS } from '@/lib/settings';
export const metadata: Metadata = { title: 'Student dashboard', alternates: { canonical: '/status' } };
export const dynamic = 'force-dynamic';

export default async function Status() {
  // Only bounce to the dashboard when the remembered applicant still exists; a stale cookie (deleted/reset record) must not cause a redirect loop.
  const ref = await getStudentRef();
  if (ref && (await q('SELECT 1 FROM applications WHERE ref=$1', [ref]).catch(() => [])).length) redirect('/dashboard');
  const s = await getSettings().catch(() => DEFAULTS);
  return (
    <>
      <Header open={s.applicationsOpen} />
      <main id="main" className="tint" style={{ padding: '56px 0 80px' }}>
        <div className="wrap" style={{ maxWidth: 640 }}>
          <div className="eyebrow">Applicants</div>
          <h1 style={{ fontSize: 'clamp(2rem,6vw,3rem)' }}>Student dashboard sign-in</h1>
          <p className="lead">Enter the reference code you received when you submitted, and the email address you applied with. After that, this device remembers you for 30 days so you can come back any time for updates.</p>
          <StatusForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
