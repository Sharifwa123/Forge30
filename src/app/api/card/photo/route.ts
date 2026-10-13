import { NextResponse } from 'next/server';
import { processPhoto } from '@/lib/photo';
import { q } from '@/lib/db';
import { cardByRef, readCardToken, photoChangesLeft } from '@/lib/card';
import { rateLimit, sameOrigin } from '@/lib/security';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
    if (!(await rateLimit('photo', 12, 3600))) return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 });
    const form = await req.formData().catch(() => null);
    const ref = readCardToken(String(form?.get('token') ?? ''));
    if (!ref) return NextResponse.json({ error: 'Your session expired. Look up your status again.' }, { status: 401 });
    const c = await cardByRef(ref);
    if (!c || c.status !== 'confirmed' || !c.student_id) return NextResponse.json({ error: 'Student cards are available once your place is confirmed.' }, { status: 403 });
    const [pc] = await q<{ has: boolean; photo_changes: number; photo_allow: number }>('SELECT photo IS NOT NULL AS has, photo_changes, photo_allow FROM applications WHERE ref=$1', [ref]);
    if (pc.has && photoChangesLeft(pc) <= 0) return NextResponse.json({ error: 'Your photo is locked. To change it, present a legal document or card showing your photo to SHARIF TECHNOLOGIES so an administrator can verify you and unlock one more change.', locked: true }, { status: 403 });
    const out = await processPhoto(form!.get('photo'));
    if (!out.ok) return NextResponse.json({ error: out.error }, { status: out.status });
    await q('UPDATE applications SET photo=$2, photo_at=now(), photo_changes = photo_changes + $3 WHERE ref=$1', [ref, out.buf, pc.has ? 1 : 0]);
    return NextResponse.json({ ok: true, changesLeft: photoChangesLeft({ photo_changes: pc.photo_changes + (pc.has ? 1 : 0), photo_allow: pc.photo_allow }) });
  } catch (e) {
    console.error('photo failed', e);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
