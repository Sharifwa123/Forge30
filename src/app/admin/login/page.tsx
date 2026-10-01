import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/security';
import LoginForm from '@/components/admin/LoginForm';
export const metadata: Metadata = { title: 'Admin sign in', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Login() {
  if (await isAdmin()) redirect('/admin');
  return <main className="adm" style={{ display: 'grid', placeItems: 'center', padding: 20 }}><LoginForm /></main>;
}
