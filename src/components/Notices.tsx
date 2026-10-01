import type { Announcement } from '@/lib/settings';
import type { NoticeStyle } from '@/lib/notice-style';
import { Rich, safeUrl } from './Rich';

export type NoticeItem = { id: string; kind: 'Notice' | 'Announcement'; at?: string; title: string; text: string; style: NoticeStyle; ctaLabel: string; ctaUrl: string; popup: boolean };

const LOOK: Record<NoticeStyle, { label: string; icon: string }> = {
  info: { label: 'Update', icon: 'ℹ' },
  important: { label: 'Important', icon: '★' },
  urgent: { label: 'Urgent', icon: '!' },
  success: { label: 'Good news', icon: '✓' },
};
export const styleLabel = (s: NoticeStyle) => LOOK[s].label;

export function toItems(s: { notice: string; noticeTitle: string; noticeStyle: NoticeStyle; noticeCtaLabel: string; noticeCtaUrl: string; noticePopup: boolean; announcements: Announcement[] }): NoticeItem[] {
  const out: NoticeItem[] = [];
  if (s.notice) out.push({ id: 'notice', kind: 'Notice', title: s.noticeTitle, text: s.notice, style: s.noticeStyle, ctaLabel: s.noticeCtaLabel, ctaUrl: s.noticeCtaUrl, popup: s.noticePopup });
  for (const a of s.announcements) out.push({ id: a.id, kind: 'Announcement', at: a.at, title: a.title, text: a.text, style: a.style, ctaLabel: a.ctaLabel, ctaUrl: a.ctaUrl, popup: a.popup });
  return out;
}

export function NoticeCard({ n, preview = false }: { n: NoticeItem; preview?: boolean }) {
  const look = LOOK[n.style] || LOOK.info;
  const fresh = n.at && Date.now() - new Date(n.at).getTime() < 72 * 3600 * 1000;
  return (
    <article className={`nt nt-${n.style}${preview ? ' nt-static' : ''}`} aria-label={`${look.label}: ${n.title || n.kind}`}>
      <div className="nt-icon" aria-hidden>{look.icon}</div>
      <div className="nt-body">
        <div className="nt-meta">
          <span className="nt-tag">{look.label}</span>
          {fresh && <span className="nt-new">NEW</span>}
          <span className="nt-kind">{n.kind}{n.at ? ' · ' + new Date(n.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
        </div>
        {n.title && <h3 className="nt-title">{n.title}</h3>}
        <Rich text={n.text} />
        {n.ctaLabel && safeUrl(n.ctaUrl) && <a className="btn btn-amber sm nt-cta" href={n.ctaUrl} target={/^https?:/i.test(n.ctaUrl) ? '_blank' : undefined} rel="noopener noreferrer">{n.ctaLabel} <span className="arrow">→</span></a>}
      </div>
    </article>
  );
}

export function NoticeStack({ items, label = 'Notices' }: { items: NoticeItem[]; label?: string }) {
  if (!items.length) return null;
  return <section className="nt-stack" aria-label={label}>{items.map((n) => <NoticeCard key={n.id} n={n} />)}</section>;
}
