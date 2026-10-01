import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { ready, pool } from '@/lib/db';
import { clean } from '@/lib/schema';
import { SECTION_KEYS, type Project } from '@/lib/project';
import { rateLimit, sameOrigin } from '@/lib/security';
import { getStudentRef } from '@/lib/student';

const text = (max: number) => z.string().transform(clean).pipe(z.string().max(max));
const Body = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('title'), title: text(120) }),
  z.object({ kind: z.literal('section'), key: z.string().refine((k) => SECTION_KEYS.includes(k)), text: text(4000), ready: z.boolean() }),
  z.object({ kind: z.literal('log.add'), text: text(1500).pipe(z.string().min(3)) }),
  z.object({ kind: z.literal('log.remove'), id: z.string().max(60) }),
]);

export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
  const ref = await getStudentRef();
  if (!ref) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  if (!(await rateLimit('project', 400, 3600))) return NextResponse.json({ error: 'Too many saves. Please wait a moment.' }, { status: 429 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'That could not be saved. Check the text and try again.' }, { status: 422 });
  const b = p.data;

  await ready();
  const c = await pool().connect();
  try {
    await c.query('BEGIN');
    const { rows } = await c.query('SELECT status, project FROM applications WHERE ref=$1 FOR UPDATE', [ref]);
    const r = rows[0];
    if (!r) { await c.query('ROLLBACK'); return NextResponse.json({ error: 'Not found.' }, { status: 404 }); }
    if (r.status === 'not_selected' || r.status === 'withdrawn') { await c.query('ROLLBACK'); return NextResponse.json({ error: 'The project workspace is not available for this application.' }, { status: 403 }); }
    const proj: Project = r.project ?? {};
    const now = new Date().toISOString();
    if (b.kind === 'title') proj.title = b.title;
    else if (b.kind === 'section') (proj.sections ??= {})[b.key] = { text: b.text, ready: b.ready && b.text.length > 0, updatedAt: now };
    else if (b.kind === 'log.add') { proj.log = [{ id: randomUUID(), at: now, text: b.text }, ...(proj.log ?? [])].slice(0, 300); }
    else proj.log = (proj.log ?? []).filter((x) => x.id !== b.id);
    await c.query('UPDATE applications SET project=$2::jsonb, updated_at=now() WHERE ref=$1', [ref, JSON.stringify(proj)]);
    await c.query('COMMIT');
    return NextResponse.json({ ok: true, updatedAt: now, log: proj.log });
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    console.error('project save failed', e);
    return NextResponse.json({ error: 'Could not save. Check your connection and try again.' }, { status: 500 });
  } finally { c.release(); }
}
