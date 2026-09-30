import { q } from './db';

export type Settings = {
  applicationsOpen: boolean;
  notice: string;
  cohortName: string;
  cohortDates: string;
  deliveryArrangement: string;
  classArrangement: string;
  announcements: { id: string; text: string; at: string }[];
};

export const DEFAULTS: Settings = {
  applicationsOpen: true,
  notice: '',
  cohortName: 'FORGE30 — first cohort',
  cohortDates: 'To be determined by SHARIF TECHNOLOGIES',
  deliveryArrangement: 'To be determined by SHARIF TECHNOLOGIES',
  classArrangement: 'To be determined by SHARIF TECHNOLOGIES',
  announcements: [],
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
