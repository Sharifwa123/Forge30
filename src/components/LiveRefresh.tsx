'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/** Keeps an open page current: re-checks every 30 s while visible, and the moment the tab/app regains focus. Refreshes in place, no reload. */
export default function LiveRefresh({ rev }: { rev: string }) {
  const router = useRouter(); const last = useRef(rev);
  useEffect(() => { last.current = rev; }, [rev]);
  useEffect(() => {
    const ms = (window as any).__PULSE_MS ?? 30000; // test hook
    const check = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch('/api/student/pulse', { cache: 'no-store' }); if (!r.ok) return;
        const { rev: now } = await r.json();
        if (now && now !== last.current) { last.current = now; router.refresh(); }
      } catch { /* offline: try again next time */ }
    };
    const t = setInterval(check, ms); const wake = () => { if (!document.hidden) void check(); };
    document.addEventListener('visibilitychange', wake); window.addEventListener('focus', wake); window.addEventListener('online', wake);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', wake); window.removeEventListener('focus', wake); window.removeEventListener('online', wake); };
  }, [router]);
  return null;
}
