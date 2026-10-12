import { q } from '@/lib/db';
import { waLink } from '@/lib/whatsapp';
import InterestTable from '@/components/admin/InterestTable';

export default async function Interests() {
  const rows = await q<any>('SELECT id, name, whatsapp, contacted, created_at FROM interests ORDER BY contacted ASC, created_at DESC LIMIT 1000');
  return (
    <>
      <h1 style={{ fontSize: '1.6rem' }}>Interested ({rows.length})</h1>
      <p className="note">People who left their name and WhatsApp number on the landing page but have not (necessarily) applied. Message them and invite them to apply.</p>
      <p><a className="btn btn-line sm" href="/api/admin/interests">Export CSV</a></p>
      <InterestTable rows={rows.map((r) => ({ id: Number(r.id), name: r.name, whatsapp: r.whatsapp, contacted: r.contacted, date: new Date(r.created_at).toLocaleDateString('en-GB'), link: waLink(r.whatsapp, `Hello ${r.name.split(' ')[0]}, thank you for your interest in FORGE30 by SHARIF TECHNOLOGIES. `) }))} />
    </>
  );
}
