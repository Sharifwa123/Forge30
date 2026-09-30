'use client';
import { useRouter } from 'next/navigation';
export default function LogoutButton() {
  const r = useRouter();
  return <button className="btn btn-ghost sm" onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); r.replace('/admin/login'); r.refresh(); }}>Sign out</button>;
}
