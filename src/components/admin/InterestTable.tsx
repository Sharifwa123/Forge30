'use client';
import { useRouter } from 'next/navigation';
import { useDialog } from '../Dialog';

type Row = { id: number; name: string; whatsapp: string; contacted: boolean; date: string; link: string };

export default function InterestTable({ rows }: { rows: Row[] }) {
  const r = useRouter(); const { confirm } = useDialog();
  async function act(body: object) { await fetch('/api/admin/interests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); r.refresh(); }
  return (
    <div className="tbl-wrap">
      <table>
        <thead><tr><th>Name</th><th>WhatsApp</th><th>Date</th><th>Contacted</th><th /></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={5} style={{ padding: 28, textAlign: 'center' }}>Nobody has left their number yet.</td></tr>}
          {rows.map((x) => (
            <tr key={x.id}>
              <td><b>{x.name}</b></td>
              <td><a href={x.link} target="_blank" rel="noopener noreferrer">{x.whatsapp}</a></td>
              <td>{x.date}</td>
              <td><input type="checkbox" checked={x.contacted} aria-label={`Contacted ${x.name}`} onChange={(e) => act({ id: x.id, contacted: e.target.checked })} /></td>
              <td><button className="btn btn-line sm" onClick={async () => { if (await confirm({ title: `Remove ${x.name}?`, body: <p>This removes them from the interested list.</p>, confirmLabel: 'Remove', tone: 'danger' })) act({ id: x.id, delete: true }); }}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
