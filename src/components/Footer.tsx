import Logo from './Logo';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo size={88} />
          <div><b style={{ color: '#fff' }}>FORGE30</b> · SHARIF TECHNOLOGIES<br /><i style={{ fontFamily: 'var(--serif)' }}>Knowledge Is Power</i></div>
        </div>
        <nav aria-label="Footer" style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}><Link href="/apply">Apply</Link><Link href="/status">Student dashboard</Link><Link href="/privacy">Privacy</Link></nav>
      </div>
      <div className="wrap" style={{ marginTop: 22, fontSize: '.82rem', borderTop: '1px solid var(--line-dark)', paddingTop: 16 }}>
        © {new Date().getFullYear()} SHARIF TECHNOLOGIES. FORGE30 makes no claim of accreditation, employment guarantee or income outcome.
      </div>
    </footer>
  );
}
