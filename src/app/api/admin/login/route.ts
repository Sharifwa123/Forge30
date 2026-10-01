import { NextResponse } from 'next/server';
import { audit, createAdminSession, rateLimit, safeEqual, sameOrigin } from '@/lib/security';

export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
  if (!(await rateLimit('login', 8, 900))) return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length < 12) return NextResponse.json({ error: 'Admin access is not configured.' }, { status: 503 });
  const b = await req.json().catch(() => null);
  const pw = typeof b?.password === 'string' ? b.password.slice(0, 200) : '';
  await new Promise((r) => setTimeout(r, 400)); // slow down guessing
  if (!safeEqual(pw, expected)) { await audit('admin.login_failed'); return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 }); }
  await createAdminSession();
  await audit('admin.login');
  return NextResponse.json({ ok: true });
}
