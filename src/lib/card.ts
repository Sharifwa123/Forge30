import { createHmac, randomBytes } from 'node:crypto';
import { q } from './db';
import { safeEqual } from './security';

const secret = () => process.env.SESSION_SECRET!;
const b64 = (s: string) => Buffer.from(s).toString('base64url');

/** Short-lived token an applicant gets after proving ref+email; authorises photo upload and card download. */
export function cardToken(ref: string, ttlSec = 3600) {
  const payload = `${ref}.${Math.floor(Date.now() / 1000) + ttlSec}`;
  return `${b64(payload)}.${createHmac('sha256', secret()).update(payload).digest('base64url')}`;
}
export function readCardToken(t: string | null | undefined): string | null {
  if (!t) return null;
  const [p, sig] = t.split('.');
  if (!p || !sig) return null;
  let payload: string; try { payload = Buffer.from(p, 'base64url').toString(); } catch { return null; }
  if (!safeEqual(sig, createHmac('sha256', secret()).update(payload).digest('base64url'))) return null;
  const [ref, exp] = payload.split('.');
  return Number(exp) > Date.now() / 1000 ? ref : null;
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
const newSerial = () => { const b = randomBytes(12); const c = [...b].map((x) => ALPHABET[x % 32]).join(''); return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}`; };

/** Issue student ID + serial (once) to applicants who are confirmed. Safe to call repeatedly. */
export async function issueCredentials(ids: number[]) {
  if (!ids.length) return;
  const rows = await q<{ id: string }>(`SELECT id FROM applications WHERE id = ANY($1::bigint[]) AND status='confirmed' AND student_id IS NULL ORDER BY id`, [ids]);
  for (const r of rows) {
    await q(`UPDATE applications SET student_id = 'F30-' || to_char(now(),'YY') || '-' || lpad(nextval('student_seq')::text, 4, '0'), serial=$2, confirmed_at=now() WHERE id=$1 AND student_id IS NULL`, [r.id, newSerial()]);
  }
}

export type CardRow = { ref: string; name: string; student_id: string | null; serial: string | null; seat: string; group_label: string; session_time: string; status: string; has_photo: boolean; confirmed_at: string | null; data: any };
export async function cardByRef(ref: string) {
  const [r] = await q<CardRow>(`SELECT ref, name, student_id, serial, seat, group_label, session_time, status, photo IS NOT NULL AS has_photo, confirmed_at, data FROM applications WHERE ref=$1`, [ref]);
  return r;
}

/** Replacements a student may still make: 1 free change after the first upload, plus any an admin granted after ID verification. */
export const photoChangesLeft = (r: { photo_changes: number; photo_allow: number }) => 1 + (r.photo_allow ?? 0) - (r.photo_changes ?? 0);
