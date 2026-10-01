import { q } from './db';

export type Settings = {
  applicationsOpen: boolean;
  notice: string;
  cohortName: string;
  cohortDates: string;
  deliveryArrangement: string;
  classArrangement: string;
  announcements: { id: string; text: string; at: string }[];
  organizer: Organizer;
};
export type Organizer = { name: string; title: string; bio: string; website: string; location: string; email: string; phone: string; whatsapp: string };

export const DEFAULTS: Settings = {
  applicationsOpen: true,
  notice: '',
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
  return s as Settings;
}

export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  await q(`INSERT INTO settings(key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`, [key, JSON.stringify(value)]);
}
