'use client';
import { track } from '@/lib/track';

/** The permanent "Join the WhatsApp group" button. The admin switches it on or off and sets the link and wording. */
export default function GroupJoin({ url, label, className = '' }: { url: string; label: string; className?: string }) {
  if (!url) return null;
  return <a className={`btn btn-wa ${className}`} href={url} target="_blank" rel="noopener noreferrer" onClick={() => track('group_clicked')}><span aria-hidden>💬</span> {label}</a>;
}
