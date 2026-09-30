import Link from 'next/link';
import { q } from '@/lib/db';
import { listApplications, type Filters } from '@/lib/admin-query';
import { OPTIONS, STATUSES, STATUS_LABEL, label } from '@/lib/schema';
import ApplicantTable from '@/components/admin/ApplicantTable';

export default async function Admin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const f: Filters = {};
  for (const k of ['search', 'status', 'location', 'device', 'format', 'period', 'certificate', 'contrib', 'sort'] as const) if (sp[k]) f[k] = sp[k]!.slice(0, 100);
  const [rows, counts] = await Promise.all([listApplications(f), q<{ status: string; n: string }>('SELECT status, count(*) n FROM applications GROUP BY status')]);
  const total = counts.reduce((a, c) => a + Number(c.n), 0);
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();
  const devices = [...new Set([...OPTIONS.computer, ...OPTIONS.phone].map((o) => o[0]))];
  return (
    <>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '0 0 18px' }}>
        <span className="pill">{total} total</span>
        {STATUSES.map((s) => <span key={s} className={'pill ' + s}>{STATUS_LABEL[s]}: {counts.find((c) => c.status === s)?.n ?? 0}</span>)}
      </div>
      <form className="filters" method="get">
        <input name="search" placeholder="Search name, email, phone, ref" defaultValue={f.search} aria-label="Search" />
        <input name="location" placeholder="Location" defaultValue={f.location} aria-label="Location" />
        <select name="status" defaultValue={f.status ?? ''} aria-label="Status"><option value="">Any status</option>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
        <select name="device" defaultValue={f.device ?? ''} aria-label="Device"><option value="">Any device</option>{OPTIONS.computer.map(([v, l]) => <option key={v} value={v}>Computer: {l}</option>)}{OPTIONS.phone.map(([v, l]) => <option key={'p' + v} value={v}>Phone: {l}</option>)}</select>
        <select name="format" defaultValue={f.format ?? ''} aria-label="Format preference"><option value="">Any format pref.</option>{OPTIONS.format.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select name="period" defaultValue={f.period ?? ''} aria-label="Availability"><option value="">Any availability</option>{OPTIONS.period.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select name="contrib" defaultValue={f.contrib ?? ''} aria-label="Contribution preference"><option value="">Any contribution pref.</option>{OPTIONS.contribPref.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select name="certificate" defaultValue={f.certificate ?? ''} aria-label="Certificate"><option value="">Any certificate pref.</option>{OPTIONS.certificate.map(([v, l]) => <option key={v} value={v}>Certificate: {l}</option>)}</select>
        <select name="sort" defaultValue={f.sort ?? 'newest'} aria-label="Sort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select>
        <button className="btn btn-primary sm">Apply filters</button>
        <Link className="btn btn-line sm" href="/admin">Clear</Link>
        <a className="btn btn-line sm" href={`/api/admin/export?${qs}`}>Export CSV ({rows.length})</a>
      </form>
      <ApplicantTable rows={rows.map((r) => ({ id: Number(r.id), ref: r.ref, name: r.name, email: r.email, phone: r.phone, location: r.location, status: r.status, created: new Date(r.created_at).toLocaleDateString('en-GB'), format: label('format', r.data.availability.format), computer: label('computer', r.data.device.computer), periods: r.data.availability.periods.join(', '), contrib: r.data.availability.contribRange ? label('contribRange', r.data.availability.contribRange) : '—', commit: r.data.commitment.seriousness }))} />
    </>
  );
}
