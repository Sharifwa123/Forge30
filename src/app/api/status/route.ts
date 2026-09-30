import { NextResponse } from 'next/server';
import { z } from 'zod';
import { q } from '@/lib/db';
import { rateLimit, sameOrigin } from '@/lib/security';
import { STATUS_LABEL, type Status } from '@/lib/schema';
import { setStudentSession } from '@/lib/student';

const Body = z.object({ ref: z.string().trim().toUpperCase().max(20), email: z.string().trim().toLowerCase().max(200) });

export async function POST(req: Request) {
  try {
    if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
    if (!(await rateLimit('status', 15, 600))) return NextResponse.json({ error: 'Too many lookups. Please wait a few minutes.' }, { status: 429 });
    const p = Body.safeParse(await req.json().catch(() => null));
    if (!p.success) return NextResponse.json({ error: 'Enter your reference code and email.' }, { status: 400 });
    const rows = await q<{ status: Status; created_at: string }>('SELECT status, created_at FROM applications WHERE ref=$1 AND email=$2', [p.data.ref, p.data.email]);
    const r = rows[0];
    if (!r) return NextResponse.json({ error: 'We could not find an application matching those details.' }, { status: 404 });
    await setStudentSession(p.data.ref);
    return NextResponse.json({ status: r.status, label: STATUS_LABEL[r.status], submittedAt: r.created_at });
  } catch (e) {
    console.error('status failed', e);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
