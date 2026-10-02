import { toItems } from '@/components/Notices';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Dashboard } from '@/components/Dashboard';
import { q } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { getStudentRef } from '@/lib/student';
import { cardToken, photoChangesLeft } from '@/lib/card';
import { summarize } from '@/lib/project';
import { revOf } from '@/lib/rev';
import LiveRefresh from '@/components/LiveRefresh';
export const metadata: Metadata = { title: 'My dashboard', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const ref = await getStudentRef();
  if (!ref) redirect('/status');
  const [r] = await q<any>('SELECT ref, name, email, phone, status, student_id, serial, seat, group_label, cohort_label, class_code, session_time, student_message, contact, created_at, photo IS NOT NULL AS has_photo, photo_at, confirmed_at, photo_changes, photo_allow, project FROM applications WHERE ref=$1', [ref]);
  if (!r) redirect('/status');
  const s = await getSettings();
  const confirmed = r.status === 'confirmed' && !!r.student_id;
  const rev = revOf(r, s);
  return (
    <>
      <Header open={s.applicationsOpen} />
      <main id="main" className="tint" style={{ padding: '40px 0 100px' }}>
        <div className="wrap" style={{ maxWidth: 980 }}>
          <Dashboard
            me={{ ref: r.ref, name: r.name, email: r.email, phone: r.phone, status: r.status, studentId: r.student_id, seat: r.seat, group: r.group_label, cohort: r.cohort_label, classCode: r.class_code, session: r.session_time, message: r.student_message || '', hasPhoto: r.has_photo, photoChangesLeft: photoChangesLeft(r), submitted: new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), contact: r.contact }}
            settings={{ cohortName: s.cohortName, cohortDates: s.cohortDates, delivery: s.deliveryArrangement, classArrangement: s.classArrangement, items: toItems(s), organizer: s.organizer }}
            rev={rev}
            cardToken={confirmed ? cardToken(ref, 6 * 3600) : null}
            project={r.status === 'not_selected' || r.status === 'withdrawn' ? null : { ...summarize(r.project), feedback: r.project?.feedback?.length ?? 0, journal: r.project?.log?.length ?? 0 }}
          />
        </div>
        <LiveRefresh rev={rev} />
      </main>
      <Footer />
    </>
  );
}
