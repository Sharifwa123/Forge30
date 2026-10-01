import { NextResponse } from 'next/server';
import { destroyAdminSession, sameOrigin } from '@/lib/security';
export async function POST() {
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
  await destroyAdminSession();
  return NextResponse.json({ ok: true });
}
