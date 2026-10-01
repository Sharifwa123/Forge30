import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { rateLimit } from '@/lib/security';

// Public by design: whoever scans a valid, active card sees the holder's photo to compare with the person presenting it.
export async function GET(_: Request, ctx: { params: Promise<{ serial: string }> }) {
  const { serial } = await ctx.params;
  if (!/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(serial)) return new NextResponse(null, { status: 404 });
  if (!(await rateLimit('verifyphoto', 60, 600))) return new NextResponse(null, { status: 429 });
  const [r] = await q<{ photo: Buffer | null; status: string }>('SELECT photo, status FROM applications WHERE serial=$1', [serial]);
  if (!r?.photo || r.status !== 'confirmed') return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(r.photo), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store' } });
}
