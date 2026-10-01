/** Normalise a configured site URL to a clean absolute origin: adds https:// if missing, drops paths and trailing slashes. */
export function normalizeOrigin(raw?: string | null): string | null {
  const v = (raw ?? '').trim();
  if (!v) return null;
  try { return new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`).origin; } catch { return null; }
}

/** Public origin for links printed on cards: env if set, else the host the request came in on. */
export function siteOrigin(h: Headers): string {
  return normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL)
    ?? normalizeOrigin(`${h.get('x-forwarded-proto') || 'https'}://${h.get('x-forwarded-host') || h.get('host')}`)
    ?? 'https://forge30.example.com';
}

export const SERIAL_RE = /[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}/;
