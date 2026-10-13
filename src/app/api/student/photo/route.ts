import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { processPhoto } from '@/lib/photo';
import { rateLimit, sameOrigin } from '@/lib/security';
import { getStudentRef } from '@/lib/student';

export const runtime = 'nodejs';

/** The passport photo taken with the application (or added from the dashboard) before the place is confirmed. Free to replace until confirmed; after that the card panel's one-change rule applies. */
export async function POST(req: Request) {
  try {
    if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
    if (!(await rateLimit('photo', 12, 3600))) return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 });
    const ref = await getStudentRef();
    if (!ref) return NextResponse.json({ error: 'Your session expired. Sign in to your dashboard and add the photo there.' }, { status: 401 });
    const [a] = await q<{ status: string }>('SELECT status FROM applications WHERE ref=$1', [ref]);
    if (!a) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    if (a.status === 'confirmed') return NextResponse.json({ error: 'Your place is confirmed. Change your photo from your student card section.' }, { status: 403 });
    const form = await req.formData().catch(() => null);
    const out = await processPhoto(form?.get('photo'));
    if (!out.ok) return NextResponse.json({ error: out.error }, { status: out.status });
    await q('UPDATE applications SET photo=$2, photo_at=now(), updated_at=now() WHERE ref=$1', [ref, out.buf]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('student photo failed', e);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
