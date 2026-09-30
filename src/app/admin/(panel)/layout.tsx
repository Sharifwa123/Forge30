import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/security';
import LogoutButton from '@/components/admin/LogoutButton';
export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect('/admin/login');
  return (
    <div className="adm">
      <div className="top"><div className="wrap row"><b style={{ marginRight: 12 }}>FORGE30 admin</b><Link href="/admin">Applicants</Link><Link href="/admin/settings">Cohort &amp; settings</Link><span style={{ flex: 1 }} /><LogoutButton /></div></div>
      <main><div className="wrap">{children}</div></main>
    </div>
  );
}
