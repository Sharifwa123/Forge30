import { NextResponse } from 'next/server';
import { applicationSchema, normalizePhone } from '@/lib/schema';
import { q } from '@/lib/db';
import { getSettings, acceptingApplications } from '@/lib/settings';
import { newRef, rateLimit, sameOrigin } from '@/lib/security';

export async function POST(req: Request) {
  try {
    if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
    if (!(await rateLimit('apply', Number(process.env.APPLY_RATE_LIMIT) || 6, 3600))) return NextResponse.json({ error: 'Too many attempts. Please wait a while and try again.' }, { status: 429 });
    const raw = await req.text();
    if (raw.length > 60_000) return NextResponse.json({ error: 'Submission is too large.' }, { status: 413 });
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

    const settings = await getSettings();
    const acc = await acceptingApplications(settings);
    if (!acc.open) return NextResponse.json({ error: acc.full ? 'Applications are closed: all places have been filled.' : 'Applications are currently closed.', closed: true }, { status: 403 });

    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const i of parsed.error.issues) fields[i.path.join('.')] ??= i.message;
      return NextResponse.json({ error: 'Some answers need attention.', fields }, { status: 422 });
    }
    const a = parsed.data;
    if (a.availability.format === 'remote') { a.availability.contribPref = undefined; a.availability.contribRange = undefined; }
    const phone = normalizePhone(a.about.phone);
    const ref = newRef();
    try {
      await q(`INSERT INTO applications(ref,email,phone,name,location,data) VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
        [ref, a.about.email, phone, a.about.fullName, a.about.location, JSON.stringify(a)]);
    } catch (e: any) {
      if (e?.code === '23505') return NextResponse.json({ error: 'An application with this email address or phone number already exists. Sign in to your student dashboard with your reference code instead.', duplicate: true }, { status: 409 });
      throw e;
    }
    return NextResponse.json({ ok: true, ref });
  } catch (e) {
    console.error('apply failed', e);
    return NextResponse.json({ error: 'Something went wrong on our side. Your answers are saved on this device — please try again shortly.' }, { status: 500 });
  }
}
