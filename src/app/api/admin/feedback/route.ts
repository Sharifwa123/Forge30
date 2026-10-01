import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { q } from '@/lib/db';
import { audit, isAdmin, sameOrigin } from '@/lib/security';
import { clean } from '@/lib/schema';
import type { Project } from '@/lib/project';

const Body = z.object({ id: z.number().int().positive(), text: z.string().transform(clean).pipe(z.string().min(2).max(1500)).optional(), remove: z.string().max(60).optional() });

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success || (!p.data.text && !p.data.remove)) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const [r] = await q<{ project: Project }>('SELECT project FROM applications WHERE id=$1', [p.data.id]);
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const proj = r.project ?? {};
  proj.feedback = p.data.remove ? (proj.feedback ?? []).filter((f) => f.id !== p.data.remove) : [{ id: randomUUID(), at: new Date().toISOString(), text: p.data.text! }, ...(proj.feedback ?? [])].slice(0, 100);
  await q('UPDATE applications SET project=$2::jsonb, updated_at=now() WHERE id=$1', [p.data.id, JSON.stringify(proj)]);
  await audit('project.feedback', String(p.data.id), { removed: !!p.data.remove });
  return NextResponse.json({ ok: true });
}
