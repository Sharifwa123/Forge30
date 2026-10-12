import { NextResponse } from 'next/server';
import { z } from 'zod';
import { q } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { normalizePhone, phoneOk } from '@/lib/schema';
import { rateLimit, sameOrigin } from '@/lib/security';

const Body = z.object({
  name: z.string({ message: 'Please enter your name' }).transform((s) => s.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim()).pipe(z.string().min(2, 'Please enter your name').max(80)),
  whatsapp: z.string({ message: 'Please enter your WhatsApp number' }).transform((s) => s.trim()).pipe(z.string().refine(phoneOk, 'Enter a valid WhatsApp number, e.g. 0241234567 or +233241234567')),
});

/** "Interested" sign-up: just a name and WhatsApp number, so someone can raise a hand before the full application. */
export async function POST(req: Request) {
  try {
    if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
    if (!(await rateLimit('interest', 8, 3600))) return NextResponse.json({ error: 'Too many attempts. Please wait a while and try again.' }, { status: 429 });
    const p = Body.safeParse(await req.json().catch(() => null));
    if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    await q(`INSERT INTO interests(name, whatsapp) VALUES ($1,$2) ON CONFLICT (whatsapp) DO UPDATE SET name=EXCLUDED.name`, [p.data.name, normalizePhone(p.data.whatsapp)]);
    const s = await getSettings();
    return NextResponse.json({ ok: true, groupUrl: s.whatsappGroupUrl || '' });
  } catch (e) {
    console.error('interest failed', e);
    return NextResponse.json({ error: 'Something went wrong on our side. Please try again shortly.' }, { status: 500 });
  }
}
