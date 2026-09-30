import { getSettings } from '@/lib/settings';
import { q } from '@/lib/db';
import SettingsForm from '@/components/admin/SettingsForm';

export default async function SettingsPage() {
  const s = await getSettings();
  const ev = await q<{ name: string; n: string }>(`SELECT name, count(*) n FROM events GROUP BY name`);
  const log = await q<any>('SELECT at, action, target FROM audit_log ORDER BY id DESC LIMIT 15');
  return (
    <>
      <h1 style={{ fontSize: '2rem' }}>Cohort &amp; settings</h1>
      <SettingsForm s={s} />
      <div className="grid g2" style={{ marginTop: 24 }}>
        <div className="panel"><h3>Funnel (anonymous)</h3><dl>{ev.length === 0 ? <p>No events yet.</p> : ev.map((e) => <div className="kv" key={e.name}><dt>{e.name}</dt><dd>{e.n}</dd></div>)}</dl></div>
        <div className="panel"><h3>Recent admin activity</h3>{log.map((l, i) => <div key={i} style={{ fontSize: 13, marginBottom: 6 }}>{new Date(l.at).toLocaleString('en-GB')} · <b>{l.action}</b> {l.target}</div>)}</div>
      </div>
    </>
  );
}
