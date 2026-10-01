'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { track } from '@/lib/track';

/** Scroll-reveal, sticky mobile CTA, landing analytics. Everything degrades to visible without JS. */
export default function Enhance({ open }: { open: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    document.documentElement.classList.add('js');
    track('landing_viewed');
    const els = document.querySelectorAll('[data-anim], .rv');
    els.forEach((el) => { const sibs = el.parentElement ? [...el.parentElement.children].filter((c) => c.matches('[data-anim], .rv')) : []; (el as HTMLElement).style.setProperty('--d', `${Math.max(0, sibs.indexOf(el)) * 110}ms`); });
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0, rootMargin: '0px 0px -6% 0px' });
    els.forEach((e) => io.observe(e));
    const failsafe = window.setTimeout(() => els.forEach((e) => e.classList.add('in')), 4000); // never leave content hidden
    const hero = document.getElementById('hero'), cta = document.getElementById('final-cta');
    let heroOut = false, ctaIn = false;
    const io2 = new IntersectionObserver((es) => { es.forEach((e) => { if (e.target === hero) heroOut = !e.isIntersecting; if (e.target === cta) ctaIn = e.isIntersecting; }); setShow(heroOut && !ctaIn); });
    hero && io2.observe(hero); cta && io2.observe(cta);
    const bar = document.querySelector<HTMLElement>('.scrollbar'); let raf = 0;
    const onScroll = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; const h = document.documentElement.scrollHeight - innerHeight; bar?.style.setProperty('--p', String(h > 0 ? Math.min(1, scrollY / h) : 0)); }); };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    const details = document.getElementById('program'); let sent = false;
    const io3 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !sent) { sent = true; track('details_viewed'); } }));
    details && io3.observe(details);
    return () => { removeEventListener('scroll', onScroll); clearTimeout(failsafe); io.disconnect(); io2.disconnect(); io3.disconnect(); };
  }, []);
  return (
    <div className={'sticky' + (show ? ' show' : '')} aria-hidden={!show}>
      <Link className="btn btn-amber" href="/apply" tabIndex={show ? 0 : -1}>{open ? 'APPLY FOR FORGE30' : 'STUDENT DASHBOARD'} <span className="arrow">→</span></Link>
    </div>
  );
}
