'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const LINKS = [['/#program', 'The Program', 'program'], ['/#journey', '30 Days', 'journey'], ['/#project', 'Final Project', 'project'], ['/#faq', 'FAQ', 'faq']] as const;

export default function Header({ open }: { open: boolean }) {
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [menu]);

  useEffect(() => {
    const ids = LINKS.map((l) => l[2]);
    const els = ids.map((i) => document.getElementById(i)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-40% 0px -55% 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="hdr">
        <div className="wrap row">
          <Link href="/" className="brand" aria-label="FORGE30 by SHARIF TECHNOLOGIES — home" onClick={() => setMenu(false)}>
            <Image src="/brand/sharif-logo-512.png" alt="SHARIF TECHNOLOGIES" width={40} height={40} priority />
            <span>FORGE30<small>SHARIF TECHNOLOGIES</small></span>
          </Link>
          <nav className="nav" aria-label="Main">
            {LINKS.map(([h, t, id]) => <a key={id} className="l" href={h} aria-current={active === id}>{t}</a>)}
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
        {LINKS.map(([h, t, id]) => <a key={id} className="l" href={h} onClick={() => setMenu(false)}>{t}</a>)}
        <Link className="btn btn-amber" href="/apply" onClick={() => setMenu(false)}>{open ? 'APPLY FOR FORGE30' : 'STUDENT DASHBOARD'}</Link>
      </div>
    </>
  );
}
