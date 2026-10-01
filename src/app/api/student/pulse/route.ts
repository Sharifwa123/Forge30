import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { getStudentRef } from '@/lib/student';
import { revOf } from '@/lib/rev';

// Cheap "has anything changed?" check polled by an open dashboard. Returns only a fingerprint.
export async function GET() {
  const ref = await getStudentRef();
  if (!ref) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const [[r], s] = await Promise.all([
    q<any>('SELECT name, status, student_id, serial, seat, group_label, session_time, confirmed_at, photo_at, project FROM applications WHERE ref=$1', [ref]),
    getSettings(),
  ]);
  if (!r) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ rev: revOf(r, s) }, { headers: { 'Cache-Control': 'no-store' } });
}
