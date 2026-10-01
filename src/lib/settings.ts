import { NOTICE_STYLES, type NoticeStyle } from './notice-style';
export { NOTICE_STYLES, type NoticeStyle };
import { q } from './db';

export type Announcement = { id: string; at: string; title: string; text: string; style: NoticeStyle; ctaLabel: string; ctaUrl: string; popup: boolean };

export type Settings = {
  applicationsOpen: boolean;
  /** Stop accepting applications automatically once this many have been received (0 = no limit). */
  maxApplications: number;
  notice: string;
  noticeTitle: string; noticeStyle: NoticeStyle; noticeCtaLabel: string; noticeCtaUrl: string; noticePopup: boolean;
  cohortName: string;
  cohortDates: string;
  deliveryArrangement: string;
  classArrangement: string;
  announcements: Announcement[];
  organizer: Organizer;
};
export type Organizer = { name: string; title: string; bio: string; website: string; location: string; email: string; phone: string; whatsapp: string };

export const DEFAULTS: Settings = {
  applicationsOpen: true,
  maxApplications: 0,
  notice: '',
  noticeTitle: '', noticeStyle: 'important', noticeCtaLabel: '', noticeCtaUrl: '', noticePopup: false,
  cohortName: 'FORGE30 — first cohort',
  cohortDates: 'To be determined by SHARIF TECHNOLOGIES',
  deliveryArrangement: 'To be determined by SHARIF TECHNOLOGIES',
  classArrangement: 'To be determined by SHARIF TECHNOLOGIES',
  announcements: [],
  // Prefilled only from the public SHARIF TECHNOLOGIES GitHub profile. Edit in Admin → Cohort & settings.
  organizer: {
    name: 'SHARIF TECHNOLOGIES',
    title: 'Founder',
    bio: 'Founder of SHARIF TECHNOLOGIES, working across software, AI and cybersecurity, and focused on building practical technology. FORGE30 is the program built to turn committed beginners into people who can build real software.',
    website: 'https://www.shariftechnologies.online',
    location: 'Wenchi, Bono Region, Ghana',
    email: '', phone: '', whatsapp: '',
  },
};

export async function getSettings(): Promise<Settings> {
  const rows = await q<{ key: string; value: unknown }>('SELECT key, value FROM settings');
  const s: any = { ...DEFAULTS };
  for (const r of rows) if (r.key in DEFAULTS) s[r.key] = r.value;
  // Announcements saved before titles/styles existed still load.
  s.announcements = (s.announcements as any[]).map((a) => ({ title: '', style: 'info', ctaLabel: '', ctaUrl: '', popup: false, ...a }));
  return s as Settings;
}

/** Whether new applications are being accepted right now (open switch AND capacity not reached). */
export async function acceptingApplications(s: Settings): Promise<{ open: boolean; full: boolean; count: number }> {
  const [{ n }] = await q<{ n: string }>(`SELECT count(*) n FROM applications WHERE status <> 'withdrawn'`);
  const count = Number(n);
  const full = s.maxApplications > 0 && count >= s.maxApplications;
  return { open: s.applicationsOpen && !full, full, count };
}

export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  await q(`INSERT INTO settings(key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`, [key, JSON.stringify(value)]);
}
