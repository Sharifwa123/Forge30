import type { Metadata } from 'next';
import ApplyFlow from '@/components/ApplyFlow';
import { getSettings, DEFAULTS } from '@/lib/settings';
export const metadata: Metadata = { title: 'Apply for FORGE30', description: 'Apply for the FORGE30 cohort by SHARIF TECHNOLOGIES. Applications are reviewed before the cohort is formed.', alternates: { canonical: '/apply' } };
export const dynamic = 'force-dynamic';

export default async function Apply() {
  const s = await getSettings().catch(() => DEFAULTS);
  return <ApplyFlow open={s.applicationsOpen} notice={s.notice} announcements={s.announcements.slice(0, 3).map((a) => a.text)} />;
}
