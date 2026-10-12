'use client';
import Chevron from './Chevron';
import Logo from './Logo';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const LINKS = [['/#what', 'How it works', 'what'], ['/#path', 'Choose your path', 'path'], ['/#project', 'Final Project', 'project'], ['/#faq', 'FAQ', 'faq']] as const;

export default function Header({ open }: { open: boolean }) {
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [menu]);


  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="hdr">
        <div className="wrap row">
          <Link href="/" className="brand" aria-label="FORGE30 by SHARIF TECHNOLOGIES — home" onClick={() => setMenu(false)}>
            <Logo size={56} priority />
            <span style={{ display: 'flex', flexDirection: 'column' }}><b style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Chevron width={24} />FORGE30</b><small>SHARIF TECHNOLOGIES</small></span>
          </Link>
          <nav className="nav" aria-label="Main">
            {LINKS.map(([h, t, id]) => <a key={id} className="l" href={h} >{t}</a>)}
            <Link className="l" href="/status">Dashboard</Link>
            <Link className="btn btn-amber" href="/apply">{open ? 'APPLY' : 'DASHBOARD'}</Link>
          </nav>
          <button className="burger" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} aria-controls="drawer" onClick={() => setMenu((m) => !m)}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              {menu ? <path d="M4 4l14 14M18 4L4 18" /> : <path d="M3 6h16M3 11h16M3 16h16" />}
            </svg>
          </button>
        </div>
      </header>
      <div id="drawer" className={'drawer' + (menu ? ' open' : '')} aria-hidden={!menu} inert={!menu}>
        <Link className="btn btn-amber" href="/apply" onClick={() => setMenu(false)}>{open ? 'APPLY FOR FORGE30' : 'STUDENT DASHBOARD'}</Link>
        <div className="dlabel">The program</div>
        {LINKS.map(([h, t, id]) => <a key={id} className="l" href={h} onClick={() => setMenu(false)}>{t}</a>)}
        <div className="dlabel">Students</div>
        <Link className="l" href="/status" onClick={() => setMenu(false)}>Student dashboard</Link>
        <Link className="l" href="/dashboard/project" onClick={() => setMenu(false)}>My project</Link>
        <div className="dlabel">More</div>
        <Link className="l" href="/scan" onClick={() => setMenu(false)}>Scan a student card</Link>
        <Link className="l" href="/privacy" onClick={() => setMenu(false)}>Privacy notice</Link>
      </div>
    </>
  );
}
