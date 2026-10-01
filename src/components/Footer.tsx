import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap cols">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Image src="/brand/sharif-logo-512.png" alt="SHARIF TECHNOLOGIES" width={56} height={56} style={{ borderRadius: '50%' }} />
            <div><b style={{ color: '#fff', fontSize: '1.1rem' }}>FORGE30</b><br />SHARIF TECHNOLOGIES Developer Forge</div>
          </div>
          <p>30 DAYS • 60 HOURS • BUILD FOR REAL</p>
          <p style={{ fontStyle: 'italic' }}>Knowledge Is Power</p>
        </div>
        <div><h4>Program</h4><ul><li><a href="/#program">The program</a></li><li><a href="/#journey">30 days</a></li><li><a href="/#project">Final project</a></li><li><a href="/#faq">FAQ</a></li></ul></div>
        <div><h4>Applicants</h4><ul><li><Link href="/apply">Apply</Link></li><li><Link href="/status">Student dashboard</Link></li><li><Link href="/privacy">Privacy notice</Link></li></ul></div>
      </div>
      <div className="wrap" style={{ marginTop: 32, fontSize: '.85rem', borderTop: '1px solid var(--line-dark)', paddingTop: 20 }}>
        © {new Date().getFullYear()} SHARIF TECHNOLOGIES. FORGE30 makes no claim of accreditation, employment guarantee or income outcome.
      </div>
    </footer>
  );
}
