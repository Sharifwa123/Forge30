import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { isAdmin } from '@/lib/security';

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return new NextResponse(null, { status: 404 });
  const [r] = await q<{ photo: Buffer | null }>('SELECT photo FROM applications WHERE id=$1', [id]);
  if (!r?.photo) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(r.photo), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store' } });
}
