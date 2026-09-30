import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit, isAdmin, sameOrigin } from '@/lib/security';
import { getSettings, setSetting } from '@/lib/settings';
import { randomUUID } from 'node:crypto';

const Body = z.object({
  applicationsOpen: z.boolean().optional(),
  notice: z.string().max(500).optional(),
  cohortName: z.string().max(120).optional(),
  cohortDates: z.string().max(200).optional(),
  deliveryArrangement: z.string().max(300).optional(),
  classArrangement: z.string().max(300).optional(),
  addAnnouncement: z.string().max(500).optional(),
  removeAnnouncement: z.string().max(60).optional(),
});

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await sameOrigin())) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { addAnnouncement, removeAnnouncement, ...rest } = p.data;
  for (const [k, v] of Object.entries(rest)) if (v !== undefined) await setSetting(k as any, v as any);
  if (addAnnouncement || removeAnnouncement) {
    const cur = (await getSettings()).announcements;
    const next = removeAnnouncement ? cur.filter((a) => a.id !== removeAnnouncement) : [{ id: randomUUID(), text: addAnnouncement!.trim(), at: new Date().toISOString() }, ...cur].slice(0, 20);
    await setSetting('announcements', next);
  }
  await audit('settings.update', undefined, { keys: Object.keys(p.data) });
  return NextResponse.json({ ok: true });
}
