import { NextResponse } from 'next/server';
import { siteOrigin } from '@/lib/site';

// Short link printed in the card's QR code: keeps the QR small and easy to scan, then forwards to the verification page.
export async function GET(req: Request, ctx: { params: Promise<{ serial: string }> }) {
  const { serial } = await ctx.params;
  if (!/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(serial)) return new NextResponse('Not found', { status: 404 });
  return NextResponse.redirect(`${siteOrigin(req.headers)}/verify/${serial}`, 307);
}
