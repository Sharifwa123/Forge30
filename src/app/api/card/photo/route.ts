import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { q } from '@/lib/db';
import { cardByRef, readCardToken } from '@/lib/card';
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
    const file = form!.get('photo');
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: 'Choose a photo first.' }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'That photo is too large (max 8 MB).' }, { status: 413 });
    let out: Buffer;
    try {
      // Re-encode: verifies it is a real image, strips EXIF/location metadata, normalises orientation and size.
      const img = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 50_000_000 }).rotate();
      const meta = await img.metadata();
      if (!['jpeg', 'png', 'webp'].includes(meta.format || '')) throw new Error('format');
      if ((meta.width || 0) < 200 || (meta.height || 0) < 200) return NextResponse.json({ error: 'That photo is too small. Use a clear photo at least 200×200 pixels.' }, { status: 422 });
      out = await img.resize(480, 600, { fit: 'cover', position: 'attention' }).jpeg({ quality: 86 }).toBuffer();
    } catch { return NextResponse.json({ error: 'We could not read that file. Use a JPG, PNG or WebP photo.' }, { status: 422 }); }
    await q('UPDATE applications SET photo=$2, photo_at=now() WHERE ref=$1', [ref, out]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('photo failed', e);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
