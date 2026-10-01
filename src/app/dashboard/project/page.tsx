import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProjectWorkspace from '@/components/ProjectWorkspace';
import { q } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { getStudentRef } from '@/lib/student';
export const metadata: Metadata = { title: 'My project', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ProjectPage() {
  const ref = await getStudentRef();
  if (!ref) redirect('/status');
  const [r] = await q<any>('SELECT name, status, project FROM applications WHERE ref=$1', [ref]);
  if (!r) redirect('/status');
  const s = await getSettings();
  const blocked = r.status === 'not_selected' || r.status === 'withdrawn';
  return (
    <>
      <Header open={s.applicationsOpen} />
      <main id="main" className="tint" style={{ padding: '36px 0 100px' }}>
        <div className="wrap" style={{ maxWidth: 980 }}>
          <p className="no-print" style={{ margin: '0 0 10px' }}><Link href="/dashboard">← Student dashboard</Link></p>
          {blocked ? <div className="form-card" style={{ transform: 'none' }}><h1 style={{ fontSize: '1.6rem' }}>Project workspace unavailable</h1><p>The project workspace is not available for this application.</p></div>
            : <ProjectWorkspace name={r.name} initial={r.project ?? {}} />}
        </div>
      </main>
      <Footer />
    </>
  );
}
