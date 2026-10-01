import { NextResponse } from 'next/server';
import { z } from 'zod';
import { q } from '@/lib/db';
import { audit, isAdmin, sameOrigin } from '@/lib/security';
import { STATUSES } from '@/lib/schema';
import { issueCredentials } from '@/lib/card';

const Body = z.object({ ids: z.array(z.number().int().positive()).min(1).max(1000), status: z.enum(STATUSES) });

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const rows = await q('UPDATE applications SET status=$2, updated_at=now() WHERE id = ANY($1::bigint[]) RETURNING id', [p.data.ids, p.data.status]);
  if (p.data.status === 'confirmed') await issueCredentials(p.data.ids);
  await audit('application.bulk_status', undefined, { count: rows.length, status: p.data.status });
  return NextResponse.json({ ok: true, updated: rows.length });
}
