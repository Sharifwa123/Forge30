import { NextResponse } from 'next/server';
import { z } from 'zod';
import { q } from '@/lib/db';
import { audit, isAdmin, sameOrigin } from '@/lib/security';

const Body = z.object({ id: z.number().int().positive(), contacted: z.boolean().optional(), delete: z.boolean().optional() });

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { id, contacted, delete: del } = p.data;
  if (del) { await q('DELETE FROM interests WHERE id=$1', [id]); await audit('interest.delete', String(id)); }
  else if (contacted !== undefined) await q('UPDATE interests SET contacted=$2 WHERE id=$1', [id, contacted]);
  return NextResponse.json({ ok: true });
}

// Neutralise spreadsheet formula injection and quote everything.
const cell = (v: unknown) => { let s = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await q<any>('SELECT name, whatsapp, contacted, created_at FROM interests ORDER BY created_at DESC LIMIT 5000');
  await audit('interests.export', undefined, { count: rows.length });
  const lines = [['Name', 'WhatsApp', 'Contacted', 'Date'].map(cell).join(','), ...rows.map((r) => [r.name, r.whatsapp, r.contacted ? 'yes' : 'no', new Date(r.created_at).toISOString()].map(cell).join(','))];
  return new NextResponse('﻿' + lines.join('\r\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="forge30-interested-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
