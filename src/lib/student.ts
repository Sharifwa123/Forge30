import { createHmac } from 'node:crypto';
import { cookies } from 'next/headers';
import { safeEqual } from './security';

const COOKIE = 'f30_student', TTL = 60 * 60 * 24 * 30;
const sig = (v: string) => createHmac('sha256', process.env.SESSION_SECRET!).update('student:' + v).digest('base64url');

/** Remember an applicant on this device for 30 days after they prove ref+email once. */
export async function setStudentSession(ref: string) {
  const exp = Math.floor(Date.now() / 1000) + TTL;
  const v = `${ref}.${exp}`;
  (await cookies()).set(COOKIE, `${v}.${sig(v)}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: TTL });
}
export async function clearStudentSession() { (await cookies()).delete(COOKIE); }
export async function getStudentRef(): Promise<string | null> {
  const c = (await cookies()).get(COOKIE)?.value;
  if (!c) return null;
  const [ref, exp, s] = c.split('.');
  if (!ref || !exp || !s) return null;
  try { if (!safeEqual(s, sig(`${ref}.${exp}`))) return null; } catch { return null; }
  return Number(exp) > Date.now() / 1000 ? ref : null;
}
