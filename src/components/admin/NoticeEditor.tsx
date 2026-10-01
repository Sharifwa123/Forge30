'use client';
import { useState } from 'react';
import { NOTICE_STYLES, type NoticeStyle } from '@/lib/notice-style';
import { NoticeCard, styleLabel } from '../Notices';

export type Draft = { title: string; text: string; style: NoticeStyle; ctaLabel: string; ctaUrl: string; popup: boolean };
export const EMPTY: Draft = { title: '', text: '', style: 'important', ctaLabel: '', ctaUrl: '', popup: false };

/** Shared editor for the public notice and for announcements, with a live preview of exactly how it will look. */
export default function NoticeEditor({ idp, kind, value, onChange, children }: { idp: string; kind: 'Notice' | 'Announcement'; value: Draft; onChange: (d: Draft) => void; children?: React.ReactNode }) {
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...value, [k]: v });
  const [help, setHelp] = useState(false);
  return (
    <div>
      <div className="field"><label htmlFor={idp + '-title'}>Headline <span className="optnote">(optional, big and bold)</span></label><input id={idp + '-title'} type="text" maxLength={120} value={value.title} onChange={(e) => set('title', e.target.value)} /></div>
      <div className="field"><label htmlFor={idp}>Message</label><textarea id={idp} maxLength={1500} value={value.text} onChange={(e) => set('text', e.target.value)} style={{ minHeight: 100 }} />
        <button type="button" className="btn btn-line sm" style={{ marginTop: 6 }} onClick={() => setHelp(!help)} aria-expanded={help}>Formatting help</button>
        {help && <p className="note" style={{ marginTop: 6 }}>**bold** · *italic* · [button text](https://link) · start a line with “- ” for a bullet list · leave a blank line for a new paragraph.</p>}
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: '0 0 12px' }}>
        <legend style={{ fontWeight: 700, marginBottom: 6 }}>Style</legend>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {NOTICE_STYLES.map((s) => <label key={s} className={'chip' + (value.style === s ? ' on' : '')} style={{ cursor: 'pointer' }}><input type="radio" name={idp + '-style'} value={s} checked={value.style === s} onChange={() => set('style', s)} style={{ marginRight: 6 }} />{styleLabel(s)}</label>)}
        </div>
      </fieldset>
      <div className="grid g2">
        <div className="field"><label htmlFor={idp + '-cta'}>Button label <span className="optnote">(optional)</span></label><input id={idp + '-cta'} type="text" maxLength={40} value={value.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} placeholder="e.g. Apply now" /></div>
        <div className="field"><label htmlFor={idp + '-url'}>Button link</label><input id={idp + '-url'} type="text" maxLength={300} value={value.ctaUrl} onChange={(e) => set('ctaUrl', e.target.value)} placeholder="https://… or /apply" /></div>
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '4px 0 14px', fontWeight: 600 }}><input type="checkbox" checked={value.popup} onChange={(e) => set('popup', e.target.checked)} />Also show as a pop-up (once per visitor)</label>
      <div aria-label="Preview"><div className="eyebrow" style={{ marginBottom: 6 }}>Preview</div>
        {value.text.trim() ? <NoticeCard preview n={{ id: 'preview', kind, title: value.title, text: value.text, style: value.style, ctaLabel: value.ctaLabel, ctaUrl: value.ctaUrl, popup: value.popup, at: kind === 'Announcement' ? new Date().toISOString() : undefined }} /> : <p className="note">Start typing to see how it will look on the site.</p>}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>{children}</div>
    </div>
  );
}
