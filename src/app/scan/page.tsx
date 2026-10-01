import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Scanner from '@/components/Scanner';
export const metadata: Metadata = { title: 'Scan a student card', robots: { index: false, follow: false } };

export default function ScanPage() {
  return (
    <>
      <Header open />
      <main id="main" className="tint" style={{ padding: '40px 0 90px' }}>
        <div className="wrap" style={{ maxWidth: 640 }}>
          <div className="eyebrow">Verify a card</div>
          <h1 style={{ fontSize: 'clamp(1.8rem,5.5vw,2.6rem)' }}>Scan a FORGE30 student card</h1>
          <p className="lead">Point your camera at the QR code on the card. The verification page opens automatically.</p>
          <Scanner />
        </div>
      </main>
      <Footer />
    </>
  );
}
