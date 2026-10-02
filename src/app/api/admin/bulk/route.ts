import { NextResponse } from 'next/server';
import { z } from 'zod';
import { q } from '@/lib/db';
import { audit, isAdmin, sameOrigin } from '@/lib/security';
import { STATUSES } from '@/lib/schema';
import { placeUnassigned } from '@/lib/placement';
import { issueCredentials } from '@/lib/card';

const Body = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(1000),
  status: z.enum(STATUSES).optional(),
  delete: z.boolean().optional(),
  assign: z.object({ group: z.string().max(40).optional(), session: z.string().max(60).optional(), seatPrefix: z.string().max(10).optional(), seatStart: z.number().int().min(0).max(100000).optional() }).optional(),
  message: z.string().max(1000).optional(),
  autoPlace: z.boolean().optional(),
}).refine((b) => b.autoPlace || b.status || b.delete || b.assign || b.message !== undefined, 'Nothing to do');

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { ids, status, assign, message } = p.data;
  if (p.data.delete) {
    const rows = await q('DELETE FROM applications WHERE id = ANY($1::bigint[]) RETURNING ref', [ids]);
    await audit('application.bulk_delete', undefined, { count: rows.length, refs: rows.map((r: any) => r.ref) });
    return NextResponse.json({ ok: true, updated: rows.length });
  }
  if (p.data.autoPlace) { const n = await placeUnassigned(); await audit('application.auto_place', undefined, { placed: n }); return NextResponse.json({ ok: true, updated: n }); }
  let n = 0;
  if (status) {
    n = (await q('UPDATE applications SET status=$2, updated_at=now() WHERE id = ANY($1::bigint[]) RETURNING id', [ids, status])).length;
    if (status === 'confirmed') await issueCredentials(ids);
  }
  if (assign) {
    if (assign.group !== undefined || assign.session !== undefined) n = (await q('UPDATE applications SET group_label=COALESCE($2,group_label), session_time=COALESCE($3,session_time), updated_at=now() WHERE id = ANY($1::bigint[]) RETURNING id', [ids, assign.group?.trim() ?? null, assign.session?.trim() ?? null])).length;
    if (assign.seatStart !== undefined) {
      const ordered = await q<{ id: number }>('SELECT id FROM applications WHERE id = ANY($1::bigint[]) ORDER BY created_at, id', [ids]);
      let k = assign.seatStart;
      for (const r of ordered) await q('UPDATE applications SET seat=$2, updated_at=now() WHERE id=$1', [r.id, `${assign.seatPrefix ?? ''}${k++}`]);
      n = ordered.length;
    }
  }
  if (message !== undefined) n = (await q('UPDATE applications SET student_message=$2, updated_at=now() WHERE id = ANY($1::bigint[]) RETURNING id', [ids, message.trim()])).length;
  await audit('application.bulk_update', undefined, { count: n, status, assign, messageSet: message !== undefined });
  return NextResponse.json({ ok: true, updated: n });
}
