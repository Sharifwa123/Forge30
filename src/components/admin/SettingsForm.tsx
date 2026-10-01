'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Settings } from '@/lib/settings';
import { useDialog } from '../Dialog';

export default function SettingsForm({ s }: { s: Settings }) {
  const { confirm, confirmWith } = useDialog();
  const [v, setV] = useState({ notice: s.notice, cohortName: s.cohortName, cohortDates: s.cohortDates, deliveryArrangement: s.deliveryArrangement, classArrangement: s.classArrangement });
  const [o, setO] = useState(s.organizer); const [ann, setAnn] = useState(''); const [msg, setMsg] = useState(''); const r = useRouter();
  useEffect(() => { setV((x) => ({ ...x, notice: s.notice })); }, [s.notice]); // keep the box in step with what is actually saved
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
              const { ok, checked } = await confirmWith({ title: 'Re-open applications?', body: <><p>A public notice is still showing on the site:</p><p><b>“{s.notice}”</b></p></>, confirmLabel: 'Re-open applications', checkbox: { label: 'Also remove this notice', checked: true } });
              if (!ok) return;
              post(checked ? { applicationsOpen: true, notice: '' } : { applicationsOpen: true }, checked ? 'Applications re-opened and notice removed' : 'Applications re-opened');
            } else post({ applicationsOpen: true }, 'Applications re-opened');
          }}>Re-open applications</button>
        )}
        <div className="field" style={{ marginTop: 20 }}>
          <label htmlFor="notice">Public notice <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(a banner on the landing and application pages and in every student dashboard)</span></label>
          <input id="notice" type="text" maxLength={500} value={v.notice} onChange={(e) => setV({ ...v, notice: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary sm" disabled={v.notice.trim() === s.notice} onClick={() => post({ notice: v.notice.trim() }, v.notice.trim() ? 'Notice saved' : 'Notice removed')}>Save notice</button>
          {s.notice && <button className="btn btn-line sm" onClick={() => post({ notice: '' }, 'Notice removed')}>Remove notice</button>}
        </div>
        <div className="info blue" style={{ marginTop: 18, marginBottom: 0 }} aria-label="Currently live on the site">
          <b>Live on the site right now</b>
          {!s.notice && s.announcements.length === 0 ? <p>No notice or announcement is showing.</p> : (
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
              {s.notice && <li><b>Notice:</b> {s.notice}</li>}
              {s.announcements.slice(0, 3).map((a) => <li key={a.id}><b>Announcement:</b> {a.text}</li>)}
            </ul>
          )}
        </div>
      </div>
      <div className="panel">
        <h3>Cohort information</h3>
        <F k="cohortName" l="Cohort name" /><F k="cohortDates" l="Program dates" /><F k="deliveryArrangement" l="Delivery arrangement" /><F k="classArrangement" l="Class arrangement" />
        <button className="btn btn-primary sm" onClick={() => { const { notice: _n, ...cohort } = v; post(cohort); }}>Save settings</button> <span role="status" style={{ marginLeft: 10, fontWeight: 700 }}>{msg}</span>
      </div>
      <div className="panel">
        <h3>Organizer profile &amp; contact</h3>
        <p className="note">Shown on the public site, in students’ dashboards and on the student card back. Leave phone, WhatsApp and email empty to keep them private.</p>
        {([['name', 'Name'], ['title', 'Title'], ['location', 'Location'], ['website', 'Website (https://…)'], ['email', 'Email'], ['phone', 'Phone'], ['whatsapp', 'WhatsApp']] as const).map(([k, l]) => <div className="field" key={k}><label htmlFor={'o-' + k}>{l}</label><input id={'o-' + k} type="text" value={o[k]} onChange={(e) => setO({ ...o, [k]: e.target.value })} /></div>)}
        <div className="field"><label htmlFor="o-bio">Short bio</label><textarea id="o-bio" maxLength={800} value={o.bio} onChange={(e) => setO({ ...o, bio: e.target.value })} /></div>
        <button className="btn btn-primary sm" onClick={() => post({ organizer: o })}>Save organizer profile</button>
      </div>
      <div className="panel">
        <h3>Announcements</h3>
        <div className="field"><label htmlFor="ann">New announcement (the three latest show as banners on the landing page, and all show in student dashboards)</label><textarea id="ann" maxLength={500} value={ann} onChange={(e) => setAnn(e.target.value)} style={{ minHeight: 80 }} /></div>
        <button className="btn btn-primary sm" disabled={!ann.trim()} onClick={async () => { await post({ addAnnouncement: ann }, 'Announcement added'); setAnn(''); }}>Publish</button>
        {s.announcements.map((a) => <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderTop: '1px solid var(--line)', marginTop: 10 }}><span>{a.text}</span><button className="btn btn-line sm" onClick={() => post({ removeAnnouncement: a.id }, 'Removed')}>Remove</button></div>)}
      </div>
    </div>
  );
}
