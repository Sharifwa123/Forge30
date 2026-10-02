import { pool } from './db';

export const CLASS_SIZE = 15;
export const GROUPS = { LCS: 'LCS', ICS: 'ICS', ACS: 'ACS' } as const;
export const COHORTS = { inPerson: 'Wenchi CIC', online: 'Online' } as const;

/** Never used / low skills -> LCS, some practice -> ICS, experienced -> ACS. (Form answer "basic" = comfortable user, not yet a programmer: LCS.) */
export function groupFor(experience: string | undefined): string {
  if (experience === 'prior') return GROUPS.ACS;
  if (experience === 'some') return GROUPS.ICS;
  return GROUPS.LCS;
}
/** In person -> Wenchi CIC; remote -> Online. "Either" is placed Online (no venue seat or travel needed); an admin can move anyone. */
export function cohortFor(format: string | undefined): string {
  return format === 'in_person' ? COHORTS.inPerson : COHORTS.online;
}
export const classCode = (n: number) => `F30-${String(n).padStart(3, '0')}`;
export const seatLabel = (n: number) => `B-${String(n).padStart(2, '0')}`;
export function nextSeat(used: Iterable<string>): string | null {
  const u = new Set(used);
  for (let i = 1; i <= CLASS_SIZE; i++) if (!u.has(seatLabel(i))) return seatLabel(i);
  return null;
}

/** Place one applicant (idempotent). Serialised with an advisory lock so concurrent submissions cannot overfill a class. */
export async function placeApplicant(id: number | string): Promise<{ cohort: string; group: string; classCode: string; seat: string } | null> {
  const c = await pool().connect();
  try {
    await c.query('BEGIN');
    await c.query('SELECT pg_advisory_xact_lock(3030)');
    const { rows: [a] } = await c.query(`SELECT class_code, data->'about'->>'experience' AS exp, data->'availability'->>'format' AS fmt FROM applications WHERE id=$1`, [id]);
    if (!a || a.class_code) { await c.query('ROLLBACK'); return null; }
    const cohort = cohortFor(a.fmt), group = groupFor(a.exp);
    const { rows } = await c.query(`SELECT class_code, seat FROM applications WHERE cohort_label=$1 AND group_label=$2 AND class_code <> '' AND status <> 'withdrawn' ORDER BY class_code`, [cohort, group]);
    const by = new Map<string, string[]>(); for (const r of rows) by.set(r.class_code, [...(by.get(r.class_code) ?? []), r.seat]);
    let code = '', seat: string | null = null;
    for (const [k, seats] of by) { const s = seats.length < CLASS_SIZE ? nextSeat(seats) : null; if (s) { code = k; seat = s; break; } }
    if (!code) {
      const { rows: [m] } = await c.query(`SELECT COALESCE(max(substring(class_code from 5)::int), 0) AS n FROM applications WHERE class_code ~ '^F30-[0-9]+$'`);
      code = classCode(Number(m.n) + 1); seat = seatLabel(1);
    }
    await c.query('UPDATE applications SET cohort_label=$2, group_label=$3, class_code=$4, seat=$5, updated_at=now() WHERE id=$1', [id, cohort, group, code, seat]);
    await c.query('COMMIT');
    return { cohort, group, classCode: code, seat: seat! };
  } catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e; } finally { c.release(); }
}

/** Place everyone not yet placed, oldest application first. */
export async function placeUnassigned(): Promise<number> {
  const { q } = await import('./db');
  const rows = await q<{ id: string }>(`SELECT id FROM applications WHERE class_code='' AND status <> 'withdrawn' ORDER BY created_at, id`);
  let n = 0; for (const r of rows) if (await placeApplicant(r.id)) n++;
  return n;
}
