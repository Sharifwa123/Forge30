import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { q } from './db';

const COOKIE = 'f30_admin';
const TTL = 60 * 60 * 8;

const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 24) throw new Error('SESSION_SECRET must be set (24+ chars)');
  return s;
};
const sign = (v: string) => createHmac('sha256', secret()).update(v).digest('base64url');
export const safeEqual = (a: string, b: string) => {
  const ha = createHash('sha256').update(a).digest(), hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
};

export async function clientKey() {
  const h = await headers();
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
  return createHash('sha256').update(ip + secret()).digest('hex').slice(0, 24);
}

/** DB-backed sliding-window limiter (works on serverless). Returns true if allowed. */
export async function rateLimit(bucket: string, limit: number, windowSec: number): Promise<boolean> {
  const key = `${bucket}:${await clientKey()}`;
  const [{ n }] = await q<{ n: string }>(`SELECT count(*) n FROM rate_limits WHERE key=$1 AND at > now() - ($2 || ' seconds')::interval`, [key, String(windowSec)]);
  if (Number(n) >= limit) return false;
  await q('INSERT INTO rate_limits(key) VALUES ($1)', [key]);
  if (Math.random() < 0.02) await q(`DELETE FROM rate_limits WHERE at < now() - interval '2 days'`);
  return true;
}

/** CSRF: state-changing requests must come from our own origin. */
export async function sameOrigin() {
  const h = await headers();
  const origin = h.get('origin');
  if (!origin) return false;
  const host = h.get('x-forwarded-host') || h.get('host');
  try { return new URL(origin).host === host; } catch { return false; }
}

export async function createAdminSession() {
  const exp = Math.floor(Date.now() / 1000) + TTL;
  const nonce = randomBytes(8).toString('hex');
  const payload = `${exp}.${nonce}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: TTL });
}
export async function destroyAdminSession() { (await cookies()).delete(COOKIE); }

export async function isAdmin(): Promise<boolean> {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [exp, nonce, sig] = v.split('.');
  if (!exp || !nonce || !sig) return false;
  const payload = `${exp}.${nonce}`;
  try { if (!safeEqual(sig, sign(payload))) return false; } catch { return false; }
  return Number(exp) > Date.now() / 1000;
}

export async function audit(action: string, target?: string, detail?: unknown) {
  await q('INSERT INTO audit_log(action, target, detail) VALUES ($1,$2,$3::jsonb)', [action, target ?? null, JSON.stringify(detail ?? {})]);
}

export const newRef = () => 'F30-' + randomBytes(4).toString('hex').toUpperCase();
