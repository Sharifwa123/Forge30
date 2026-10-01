import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { q } from '@/lib/db';
import { getSettings } from '@/lib/settings';
export const metadata: Metadata = { title: 'Verify student card', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

// Public on purpose: shows only name, student ID and whether the card is active. No contact details.
export default async function Verify({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  const valid = /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(serial);
  const [r] = valid ? await q<{ name: string; student_id: string; status: string }>('SELECT name, student_id, status FROM applications WHERE serial=$1', [serial]) : [];
  const s = await getSettings().catch(() => null);
  const active = r?.status === 'confirmed';
  return (
    <>
      <Header open={s?.applicationsOpen ?? true} />
      <main id="main" className="tint" style={{ padding: '56px 0 90px' }}>
        <div className="wrap" style={{ maxWidth: 640 }}>
          <div className="form-card" style={{ transform: 'none' }} role="status">
            <div className="eyebrow">Card verification</div>
            {r ? (<>
              <h1 style={{ fontSize: 'clamp(1.8rem,5vw,2.4rem)' }}>{active ? '✓ Valid FORGE30 student card' : 'This card is no longer active'}</h1>
              <dl className="kv" style={{ marginTop: 20 }}>
                <div><dt>Name</dt><dd style={{ fontSize: '1.3rem', fontWeight: 700 }}>{r.name}</dd></div>
                <div><dt>Student ID</dt><dd style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontWeight: 700 }}>{r.student_id}</dd></div>
                <div><dt>Status</dt><dd><span className={'pill ' + (active ? 'selected' : 'not_selected')}>{active ? 'Confirmed participant' : 'Not active'}</span></dd></div>
                <div><dt>Issued by</dt><dd>SHARIF TECHNOLOGIES · FORGE30</dd></div>
              </dl>
              <p className="note">Compare the name and photo on the card with the person presenting it.</p>
            </>) : (<>
              <h1 style={{ fontSize: 'clamp(1.8rem,5vw,2.4rem)' }}>Card not recognised</h1>
              <p className="lead">No FORGE30 student card matches this code. It may be invalid or forged.</p>
            </>)}
            <Link className="btn btn-line" href="/">Back to FORGE30</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
