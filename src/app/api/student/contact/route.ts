import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { contactSchema } from '@/lib/schema';
import { rateLimit, sameOrigin } from '@/lib/security';
import { getStudentRef } from '@/lib/student';

export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
  const ref = await getStudentRef();
  if (!ref) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  if (!(await rateLimit('contact', 20, 3600))) return NextResponse.json({ error: 'Too many changes. Try again later.' }, { status: 429 });
  const p = contactSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) { const fields: Record<string, string> = {}; for (const i of p.error.issues) fields[String(i.path[0])] ??= i.message; return NextResponse.json({ error: 'Some details need attention.', fields }, { status: 422 }); }
  const r = await q('UPDATE applications SET contact=$2::jsonb, updated_at=now() WHERE ref=$1 RETURNING id', [ref, JSON.stringify(p.data)]);
  return r[0] ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
