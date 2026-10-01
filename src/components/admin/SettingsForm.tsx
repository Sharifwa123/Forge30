'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Settings } from '@/lib/settings';
import { useDialog } from '../Dialog';
import NoticeEditor, { EMPTY, type Draft } from './NoticeEditor';
import { NoticeCard } from '../Notices';
import { toItems } from '../Notices';

export default function SettingsForm({ s }: { s: Settings }) {
  const { confirm, confirmWith } = useDialog();
  const [v, setV] = useState({ cohortName: s.cohortName, cohortDates: s.cohortDates, deliveryArrangement: s.deliveryArrangement, classArrangement: s.classArrangement });
  const [o, setO] = useState(s.organizer); const [ann, setAnn] = useState<Draft>(EMPTY); const [editId, setEditId] = useState<string | null>(null); const [edit, setEdit] = useState<Draft>(EMPTY); const [max, setMax] = useState(String(s.maxApplications || ''));
  const nd = (): Draft => ({ title: s.noticeTitle, text: s.notice, style: s.noticeStyle, ctaLabel: s.noticeCtaLabel, ctaUrl: s.noticeCtaUrl, popup: s.noticePopup }); const [nt, setNt] = useState<Draft>(nd()); const [msg, setMsg] = useState(''); const r = useRouter();
  useEffect(() => { setNt(nd()); }, [s.notice, s.noticeTitle, s.noticeStyle, s.noticeCtaLabel, s.noticeCtaUrl, s.noticePopup]); // eslint-disable-line react-hooks/exhaustive-deps
  const noticeBody = (d: Draft) => ({ notice: d.text.trim(), noticeTitle: d.title.trim(), noticeStyle: d.style, noticeCtaLabel: d.ctaLabel.trim(), noticeCtaUrl: d.ctaUrl.trim(), noticePopup: d.popup }); // keep the box in step with what is actually saved
  async function post(body: object, ok = 'Saved') {
    const res = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setMsg(res.ok ? ok : 'Failed'); if (res.ok) r.refresh();
  }
  const F = ({ k, l }: { k: keyof typeof v; l: string }) => <div className="field"><label htmlFor={k}>{l}</label><input id={k} type="text" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} /></div>;
  return (
    <div className="grid g2" style={{ alignItems: 'start' }}>
      <div className="panel">
        <h3>Applications</h3>
        <p><span className={'pill ' + (s.applicationsOpen ? 'selected' : 'not_selected')}>{s.applicationsOpen ? 'OPEN' : 'CLOSED'}</span></p>
        {s.applicationsOpen ? (
          <button className="btn sm btn-line" onClick={async () => {
            if (!(await confirm({ title: 'Close applications?', body: <p>New submissions will be refused and the landing page will show applications as closed. You can re-open them at any time.</p>, confirmLabel: 'Close applications', tone: 'danger' }))) return;
            post({ applicationsOpen: false }, 'Applications closed');
          }}>Close applications</button>
        ) : (
          <button className="btn sm btn-primary" onClick={async () => {
            // Re-opening does not touch the public notice, so ask rather than leave old text live.
            if (s.notice) {
              const { ok, checked } = await confirmWith({ title: 'Re-open applications?', body: <><p>A public notice is still showing on the site:</p><p><b>“{s.notice.slice(0, 160)}”</b></p></>, confirmLabel: 'Re-open applications', checkbox: { label: 'Also remove this notice', checked: true } });
              if (!ok) return;
              post(checked ? { applicationsOpen: true, notice: '' } : { applicationsOpen: true }, checked ? 'Applications re-opened and notice removed' : 'Applications re-opened');
            } else post({ applicationsOpen: true }, 'Applications re-opened');
          }}>Re-open applications</button>
        )}
        <div className="field" style={{ marginTop: 16 }}><label htmlFor="max">Capacity <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(applications close by themselves when this many are in; 0 = no limit)</span></label>
          <div style={{ display: 'flex', gap: 8 }}><input id="max" type="text" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} style={{ maxWidth: 140 }} /><button className="btn btn-line sm" onClick={() => post({ maxApplications: Number(max) || 0 }, 'Capacity saved')}>Save capacity</button></div></div>
      </div>
      <div className="panel">
        <h3>Public notice</h3>
        <p className="note">One highlighted notice shown at the top of the landing and application pages and in every student dashboard.</p>
        <NoticeEditor idp="notice" kind="Notice" value={nt} onChange={setNt}>
          <button className="btn btn-primary sm" disabled={JSON.stringify(noticeBody(nt)) === JSON.stringify(noticeBody(nd()))} onClick={() => post(noticeBody(nt), nt.text.trim() ? 'Notice saved' : 'Notice removed')}>Save notice</button>
          {s.notice && <button className="btn btn-line sm" onClick={() => post({ notice: '', noticeTitle: '', noticeCtaLabel: '', noticeCtaUrl: '', noticePopup: false }, 'Notice removed')}>Remove notice</button>}
        </NoticeEditor>
        <div className="info blue" style={{ marginTop: 18, marginBottom: 0 }} aria-label="Currently live on the site">
          <b>Live on the site right now</b>
          {!s.notice && s.announcements.length === 0 ? <p>No notice or announcement is showing.</p> : (
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
              {toItems(s).map((n) => <li key={n.id}><b>{n.kind}:</b> {n.title ? n.title + ' — ' : ''}{n.text.slice(0, 120)}</li>)}
            </ul>
          )}
        </div>
      </div>
      <div className="panel">
        <h3>Cohort information</h3>
        <F k="cohortName" l="Cohort name" /><F k="cohortDates" l="Program dates" /><F k="deliveryArrangement" l="Delivery arrangement" /><F k="classArrangement" l="Class arrangement" />
        <button className="btn btn-primary sm" onClick={() => { post(v); }}>Save settings</button> <span role="status" style={{ marginLeft: 10, fontWeight: 700 }}>{msg}</span>
      </div>
      <div className="panel">
        <h3>Organizer profile &amp; contact</h3>
        <p className="note">Shown on the public site, in students’ dashboards and on the student card back. Leave phone, WhatsApp and email empty to keep them private.</p>
        {([['name', 'Name'], ['title', 'Title'], ['location', 'Location'], ['website', 'Website (https://…)'], ['email', 'Email'], ['phone', 'Phone'], ['whatsapp', 'WhatsApp']] as const).map(([k, l]) => <div className="field" key={k}><label htmlFor={'o-' + k}>{l}</label><input id={'o-' + k} type="text" value={o[k]} onChange={(e) => setO({ ...o, [k]: e.target.value })} /></div>)}
        <div className="field"><label htmlFor="o-bio">Short bio</label><textarea id="o-bio" maxLength={800} value={o.bio} onChange={(e) => setO({ ...o, bio: e.target.value })} /></div>
        <button className="btn btn-primary sm" onClick={() => post({ organizer: o })}>Save organizer profile</button>
      </div>
      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <h3>Announcements</h3>
        <p className="note">Each announcement appears as its own decorated card on the landing page, the application page and in every student dashboard. Newest first.</p>
        <NoticeEditor idp="ann" kind="Announcement" value={ann} onChange={setAnn}>
          <button className="btn btn-primary sm" disabled={!ann.text.trim()} onClick={async () => { await post({ addAnnouncement: { ...ann, title: ann.title.trim(), text: ann.text.trim(), ctaLabel: ann.ctaLabel.trim(), ctaUrl: ann.ctaUrl.trim() } }, 'Announcement added'); setAnn(EMPTY); }}>Publish</button>
        </NoticeEditor>
        {s.announcements.length > 0 && <h4 style={{ marginTop: 26 }}>Published ({s.announcements.length})</h4>}
        {s.announcements.map((a) => (
          <div key={a.id} style={{ borderTop: '1px solid var(--line)', marginTop: 14, paddingTop: 14 }}>
            {editId === a.id ? (
              <NoticeEditor idp={'ed-' + a.id} kind="Announcement" value={edit} onChange={setEdit}>
                <button className="btn btn-primary sm" disabled={!edit.text.trim()} onClick={async () => { await post({ updateAnnouncement: { id: a.id, ...edit } }, 'Announcement updated'); setEditId(null); }}>Save changes</button>
                <button className="btn btn-line sm" onClick={() => setEditId(null)}>Cancel</button>
              </NoticeEditor>
            ) : (<>
              <NoticeCard preview n={{ ...a, kind: 'Announcement' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn btn-line sm" onClick={() => { setEdit({ title: a.title, text: a.text, style: a.style, ctaLabel: a.ctaLabel, ctaUrl: a.ctaUrl, popup: a.popup }); setEditId(a.id); }}>Edit</button>
                <button className="btn btn-line sm" onClick={async () => { if (await confirm({ title: 'Remove this announcement?', body: <p>It disappears from the site and every student dashboard.</p>, confirmLabel: 'Remove', tone: 'danger' })) post({ removeAnnouncement: a.id }, 'Removed'); }}>Remove</button>
              </div>
            </>)}
          </div>
        ))}
        {s.announcements.length > 1 && <button className="btn btn-line sm" style={{ marginTop: 16 }} onClick={async () => { if (await confirm({ title: 'Remove all announcements?', confirmLabel: 'Remove all', tone: 'danger' })) post({ clearAnnouncements: true }, 'All announcements removed'); }}>Remove all</button>}
      </div>
    </div>
  );
}
