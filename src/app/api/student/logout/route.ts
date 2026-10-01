import { NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/security';
import { clearStudentSession } from '@/lib/student';
export async function POST() {
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
  await clearStudentSession();
  return NextResponse.json({ ok: true });
}
