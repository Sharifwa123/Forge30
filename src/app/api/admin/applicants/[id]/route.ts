import { NextResponse } from 'next/server';
import { z } from 'zod';
import { q } from '@/lib/db';
import { audit, isAdmin, sameOrigin } from '@/lib/security';
import { STATUSES, aboutSchema, normalizePhone } from '@/lib/schema';
import { issueCredentials } from '@/lib/card';

const Edit = aboutSchema.pick({ fullName: true, phone: true, email: true, location: true });
const Body = z.object({
  status: z.enum(STATUSES).optional(), adminNotes: z.string().max(5000).optional(), cohortNote: z.string().max(500).optional(),
  seat: z.string().max(20).optional(), groupLabel: z.string().max(40).optional(), sessionTime: z.string().max(60).optional(),
  studentMessage: z.string().max(1000).optional(), removePhoto: z.boolean().optional(), edit: Edit.optional(),
});

async function guard(ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return { err: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!(await sameOrigin())) return { err: NextResponse.json({ error: 'Request blocked.' }, { status: 403 }) };
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return { err: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  return { id };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard(ctx); if (g.err) return g.err; const id = g.id!;
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
  const { status, adminNotes, cohortNote, seat, groupLabel, sessionTime, studentMessage, removePhoto, edit } = p.data;
  try {
    const rows = await q(`UPDATE applications SET status=COALESCE($2,status), admin_notes=COALESCE($3,admin_notes), cohort_note=COALESCE($4,cohort_note), seat=COALESCE($5,seat), group_label=COALESCE($6,group_label), session_time=COALESCE($7,session_time), student_message=COALESCE($8,student_message), updated_at=now() WHERE id=$1 RETURNING id`, [id, status ?? null, adminNotes ?? null, cohortNote ?? null, seat?.trim() ?? null, groupLabel?.trim() ?? null, sessionTime?.trim() ?? null, studentMessage?.trim() ?? null]);
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (edit) {
      await q(`UPDATE applications SET name=$2, email=$3, phone=$4, location=$5, data=jsonb_set(data,'{about}', COALESCE(data->'about','{}'::jsonb) || $6::jsonb), updated_at=now() WHERE id=$1`,
        [id, edit.fullName, edit.email, normalizePhone(edit.phone), edit.location, JSON.stringify({ fullName: edit.fullName, email: edit.email, phone: edit.phone, location: edit.location })]);
    }
  } catch (e: any) {
    if (e?.code === '23505') return NextResponse.json({ error: 'Another applicant already uses that email address or phone number.' }, { status: 409 });
    throw e;
  }
  if (removePhoto) await q('UPDATE applications SET photo=NULL, photo_at=NULL, photo_changes=0, photo_allow=0, updated_at=now() WHERE id=$1', [id]);
  if (status === 'confirmed') await issueCredentials([Number(id)]);
  await audit(status ? 'application.status' : 'application.update', id, { status, notesChanged: adminNotes !== undefined, edited: !!edit, photoRemoved: !!removePhoto, messageChanged: studentMessage !== undefined });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard(ctx); if (g.err) return g.err; const id = g.id!;
  const rows = await q<{ ref: string; name: string }>('DELETE FROM applications WHERE id=$1 RETURNING ref, name', [id]);
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await audit('application.delete', id, { ref: rows[0].ref });
  return NextResponse.json({ ok: true });
}
