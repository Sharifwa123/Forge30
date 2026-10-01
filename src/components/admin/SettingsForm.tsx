'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Settings } from '@/lib/settings';
import { useDialog } from '../Dialog';

export default function SettingsForm({ s }: { s: Settings }) {
  const { confirm } = useDialog();
  const [v, setV] = useState({ notice: s.notice, cohortName: s.cohortName, cohortDates: s.cohortDates, deliveryArrangement: s.deliveryArrangement, classArrangement: s.classArrangement });
  const [o, setO] = useState(s.organizer); const [ann, setAnn] = useState(''); const [msg, setMsg] = useState(''); const r = useRouter();
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
        <button className={'btn sm ' + (s.applicationsOpen ? 'btn-line' : 'btn-primary')} onClick={async () => { if (s.applicationsOpen && !(await confirm({ title: 'Close applications?', body: <p>New submissions will be refused and the landing page will show applications as closed. You can re-open them at any time.</p>, confirmLabel: 'Close applications', tone: 'danger' }))) return; post({ applicationsOpen: !s.applicationsOpen }, s.applicationsOpen ? 'Applications closed' : 'Applications opened'); }}>{s.applicationsOpen ? 'Close applications' : 'Re-open applications'}</button>
        <div className="field" style={{ marginTop: 20 }}><label htmlFor="notice">Application notice (shown publicly)</label><input id="notice" type="text" maxLength={500} value={v.notice} onChange={(e) => setV({ ...v, notice: e.target.value })} /></div>
      </div>
      <div className="panel">
        <h3>Cohort information</h3>
        <F k="cohortName" l="Cohort name" /><F k="cohortDates" l="Program dates" /><F k="deliveryArrangement" l="Delivery arrangement" /><F k="classArrangement" l="Class arrangement" />
        <button className="btn btn-primary sm" onClick={() => post(v)}>Save settings</button> <span role="status" style={{ marginLeft: 10, fontWeight: 700 }}>{msg}</span>
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
        <div className="field"><label htmlFor="ann">New announcement (latest shows as a banner on the site)</label><textarea id="ann" maxLength={500} value={ann} onChange={(e) => setAnn(e.target.value)} style={{ minHeight: 80 }} /></div>
        <button className="btn btn-primary sm" disabled={!ann.trim()} onClick={async () => { await post({ addAnnouncement: ann }, 'Announcement added'); setAnn(''); }}>Publish</button>
        {s.announcements.map((a) => <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderTop: '1px solid var(--line)', marginTop: 10 }}><span>{a.text}</span><button className="btn btn-line sm" onClick={() => post({ removeAnnouncement: a.id }, 'Removed')}>Remove</button></div>)}
      </div>
    </div>
  );
}
