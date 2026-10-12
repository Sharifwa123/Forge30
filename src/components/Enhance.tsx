'use client';
import { useEffect } from 'react';
import { track } from '@/lib/track';

/** Landing analytics only. The landing page is a short, tap-through explorer, so no scroll effects or sticky bar are needed. */
export default function Enhance({ open: _open }: { open: boolean }) {
  useEffect(() => { document.documentElement.classList.add('js'); track('landing_viewed'); }, []);
  return null;
}
