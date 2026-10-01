import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit, isAdmin, sameOrigin } from '@/lib/security';
import { clean } from '@/lib/schema';
import { getSettings, setSetting, NOTICE_STYLES, type Announcement } from '@/lib/settings';
import { safeUrl } from '@/components/Rich';
import { randomUUID } from 'node:crypto';

const text = (max: number) => z.string().transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()).pipe(z.string().max(max));
const url = z.string().max(300).transform((s) => s.trim()).refine((v) => v === '' || safeUrl(v), 'Button link must start with https://, mailto:, tel: or /');
const style = z.enum(NOTICE_STYLES as [string, ...string[]]);
const NoticeFields = z.object({ title: text(120), text: text(1500), style, ctaLabel: text(40), ctaUrl: url, popup: z.boolean() });

const Body = z.object({
  applicationsOpen: z.boolean().optional(),
  maxApplications: z.number().int().min(0).max(100000).optional(),
  notice: text(1500).optional(),
  noticeTitle: text(120).optional(), noticeStyle: style.optional(), noticeCtaLabel: text(40).optional(), noticeCtaUrl: url.optional(), noticePopup: z.boolean().optional(),
  cohortName: z.string().max(120).optional(),
  cohortDates: z.string().max(200).optional(),
  deliveryArrangement: z.string().max(300).optional(),
  classArrangement: z.string().max(300).optional(),
  organizer: z.object({ name: z.string().max(100), title: z.string().max(100), bio: z.string().max(800), website: z.string().max(200).refine((v) => v === '' || /^https?:\/\//.test(v), 'Must start with http(s)://'), location: z.string().max(120), email: z.string().max(200).refine((v) => v === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'Invalid email'), phone: z.string().max(40), whatsapp: z.string().max(40) }).optional(),
  addAnnouncement: z.union([text(1500), NoticeFields]).optional(),
  updateAnnouncement: NoticeFields.extend({ id: z.string().max(60) }).optional(),
  removeAnnouncement: z.string().max(60).optional(),
  clearAnnouncements: z.boolean().optional(),
});

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
  const { addAnnouncement, updateAnnouncement, removeAnnouncement, clearAnnouncements, ...rest } = p.data;
  const needsText = (v: string | { text: string }) => (typeof v === 'string' ? v : v.text).length > 0;
  if (addAnnouncement !== undefined && !needsText(addAnnouncement)) return NextResponse.json({ error: 'Write the announcement message first.' }, { status: 400 });
  if (updateAnnouncement && !updateAnnouncement.text) return NextResponse.json({ error: 'The announcement message cannot be empty.' }, { status: 400 });
  for (const [k, v] of Object.entries(rest)) if (v !== undefined) await setSetting(k as any, v as any);

  if (addAnnouncement !== undefined || updateAnnouncement || removeAnnouncement || clearAnnouncements) {
    let cur: Announcement[] = (await getSettings()).announcements;
    if (clearAnnouncements) cur = [];
    if (removeAnnouncement) cur = cur.filter((a) => a.id !== removeAnnouncement);
    if (updateAnnouncement) { const { id, ...f } = updateAnnouncement; cur = cur.map((a) => (a.id === id ? { ...a, ...f, style: f.style as Announcement['style'] } : a)); }
    if (addAnnouncement !== undefined) {
      const f = typeof addAnnouncement === 'string' ? { title: '', text: addAnnouncement, style: 'info', ctaLabel: '', ctaUrl: '', popup: false } : addAnnouncement;
      cur = [{ id: randomUUID(), at: new Date().toISOString(), ...f, style: f.style as Announcement['style'] }, ...cur].slice(0, 20);
    }
    await setSetting('announcements', cur);
  }
  await audit('settings.update', undefined, { keys: Object.keys(p.data) });
  return NextResponse.json({ ok: true });
}
