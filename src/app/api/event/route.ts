import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { rateLimit, sameOrigin } from '@/lib/security';

const NAMES = new Set(['landing_viewed', 'details_viewed', 'gate_passed', 'application_started', 'step_completed', 'application_abandoned', 'application_submitted']);
const STEPS = new Set(['about', 'commitment', 'availability', 'device', 'project', 'finish', 'review']);

// No personal data: only an event name and an optional step name.
export async function POST(req: Request) {
  try {
    if (!(await sameOrigin())) return new NextResponse(null, { status: 204 });
    if (!(await rateLimit('event', 60, 600))) return new NextResponse(null, { status: 204 });
    const b = await req.json().catch(() => null);
    if (b && NAMES.has(b.name)) await q('INSERT INTO events(name, step) VALUES ($1,$2)', [b.name, STEPS.has(b.step) ? b.step : null]);
  } catch {}
  return new NextResponse(null, { status: 204 });
}
