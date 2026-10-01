import type { Metadata } from 'next';
import ApplyFlow from '@/components/ApplyFlow';
import { getSettings, DEFAULTS, acceptingApplications } from '@/lib/settings';
import { NoticeStack, toItems } from '@/components/Notices';
import NoticePopup from '@/components/NoticePopup';
export const metadata: Metadata = { title: 'Apply for FORGE30', description: 'Apply for the FORGE30 cohort by SHARIF TECHNOLOGIES. Applications are reviewed before the cohort is formed.', alternates: { canonical: '/apply' } };
export const dynamic = 'force-dynamic';

export default async function Apply() {
  const s = await getSettings().catch(() => DEFAULTS);
  const open = (await acceptingApplications(s).catch(() => ({ open: s.applicationsOpen }))).open;
  const items = toItems(s);
  return <><NoticeStack items={items} /><NoticePopup items={items} /><ApplyFlow open={open} /></>;
}
