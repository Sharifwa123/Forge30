import { NextResponse } from 'next/server';
import { z } from 'zod';
import { q } from '@/lib/db';
import { audit, isAdmin, sameOrigin } from '@/lib/security';
import { STATUSES } from '@/lib/schema';

const Body = z.object({ status: z.enum(STATUSES).optional(), adminNotes: z.string().max(5000).optional(), cohortNote: z.string().max(500).optional() });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { status, adminNotes, cohortNote } = p.data;
  const rows = await q(`UPDATE applications SET status=COALESCE($2,status), admin_notes=COALESCE($3,admin_notes), cohort_note=COALESCE($4,cohort_note), updated_at=now() WHERE id=$1 RETURNING id`, [id, status ?? null, adminNotes ?? null, cohortNote ?? null]);
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await audit(status ? 'application.status' : 'application.update', id, { status, notesChanged: adminNotes !== undefined });
  return NextResponse.json({ ok: true });
}
