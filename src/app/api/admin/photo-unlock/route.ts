import { NextResponse } from 'next/server';
import { z } from 'zod';
import { q } from '@/lib/db';
import { audit, isAdmin, sameOrigin } from '@/lib/security';
import { clean } from '@/lib/schema';

const Body = z.object({ id: z.number().int().positive(), idChecked: z.string().transform(clean).pipe(z.string().min(3).max(120)) });

// Student photos lock after one change. An admin unlocks one more change only after seeing a legal document/card with the student's photo.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Enter which document you verified (for example "Ghana Card").' }, { status: 400 });
  const r = await q('UPDATE applications SET photo_allow = photo_allow + 1, updated_at=now() WHERE id=$1 AND photo IS NOT NULL RETURNING id', [p.data.id]);
  if (!r[0]) return NextResponse.json({ error: 'No photo on file.' }, { status: 404 });
  await audit('photo.unlock', String(p.data.id), { documentChecked: p.data.idChecked });
  return NextResponse.json({ ok: true });
}
