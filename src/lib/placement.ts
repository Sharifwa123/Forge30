import { pool } from './db';
import { groupFor } from './levels';
export { groupFor };

export const CLASS_SIZE = 15;
export const GROUPS = { LCS: 'LCS', ICS: 'ICS', ACS: 'ACS' } as const;
export const COHORTS = { inPerson: 'Wenchi CIC', online: 'Online' } as const;

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

type PRow = { id: string; status: string; exp: string | null; fmt: string | null; pinned: boolean; cohort_label: string; group_label: string; class_code: string; seat: string; student_id: string | null; confirmed_at: Date | null };
const INACTIVE = new Set(['withdrawn', 'not_selected']);

/** Pure layout: given everyone in application order, work out each person's cohort, group, class and seat. Rows an admin placed by hand ("pinned") are left alone and their seats stay reserved. */
export function layout(rows: Pick<PRow, 'id' | 'status' | 'exp' | 'fmt' | 'pinned' | 'class_code' | 'seat'>[]) {
  const reserved = new Map<string, Set<string>>();
  for (const r of rows) if (r.pinned && !INACTIVE.has(r.status) && r.class_code && r.seat) { if (!reserved.has(r.class_code)) reserved.set(r.class_code, new Set()); reserved.get(r.class_code)!.add(r.seat); }
  const open = new Map<string, { code: string; used: Set<string> }>();
  const out = new Map<string, { cohort: string; group: string; class_code: string; seat: string }>();
  let n = 0;
  const freeSeat = (code: string, used: Set<string>) => nextSeat([...used, ...(reserved.get(code) ?? [])]);
  for (const r of rows) {
    if (r.pinned || INACTIVE.has(r.status)) continue;
    const cohort = cohortFor(r.fmt ?? undefined), group = groupFor(r.exp ?? undefined), key = cohort + '|' + group;
    let cls = open.get(key); let seat = cls ? freeSeat(cls.code, cls.used) : null;
    while (!cls || !seat) { cls = { code: classCode(++n), used: new Set() }; open.set(key, cls); seat = freeSeat(cls.code, cls.used); }
    cls.used.add(seat);
    out.set(r.id, { cohort, group, class_code: cls.code, seat });
  }
  return out;
}

/** Student numbers follow confirmation order among students who are currently confirmed, so removing someone moves everyone after them up by one. */
export function numbering(rows: Pick<PRow, 'id' | 'status' | 'student_id' | 'confirmed_at'>[], yy: string) {
  const students = rows.filter((r) => r.status === 'confirmed' && r.student_id).sort((a, b) => (a.confirmed_at ? +new Date(a.confirmed_at) : Infinity) - (b.confirmed_at ? +new Date(b.confirmed_at) : Infinity) || Number(a.id) - Number(b.id));
  const out = new Map<string, string>();
  students.forEach((r, k) => out.set(r.id, `F30-${/^F30-(\d{2})-/.exec(r.student_id!)?.[1] ?? yy}-${String(k + 1).padStart(4, '0')}`));
  return out;
}

/**
 * Recalculate every class, seat and student ID from scratch, in application order, and tell anyone whose place moved.
 * Run after anything that changes who counts: applying, withdrawing, deleting, confirming, re-instating, or an admin unpinning someone.
 * Serialised with an advisory lock so two requests can never hand out the same seat. Returns how many people changed.
 */
export async function repack(): Promise<number> {
  const c = await pool().connect();
  try {
    await c.query('BEGIN');
    await c.query('SELECT pg_advisory_xact_lock(3030)');
    const { rows } = await c.query<PRow>(`SELECT id, status, data->'about'->>'experience' AS exp, data->'availability'->>'format' AS fmt, placement_pinned AS pinned, cohort_label, group_label, class_code, seat, student_id, confirmed_at FROM applications ORDER BY created_at, id`);
    const place = layout(rows); const ids = numbering(rows, String(new Date().getFullYear()).slice(2));
    const changes: { r: PRow; cohort: string; group: string; code: string; seat: string; sid: string | null; note: string }[] = [];
    for (const r of rows) {
      let cohort = r.cohort_label, group = r.group_label, code = r.class_code, seat = r.seat;
      if (!r.pinned) { const p = place.get(r.id); if (p) ({ cohort, group, class_code: code, seat } = p); else if (INACTIVE.has(r.status)) { code = ''; seat = ''; } }
      const sid = r.status === 'confirmed' && r.student_id ? ids.get(r.id)! : null;
      const moved = code !== r.class_code || seat !== r.seat, renumbered = sid !== r.student_id;
      if (!moved && !renumbered && cohort === r.cohort_label && group === r.group_label) continue;
      const parts: string[] = [];
      if (moved && r.class_code && code) parts.push(`Your class and seat changed: ${r.class_code} · ${r.seat} is now ${code} · ${seat}.`);
      if (renumbered && r.student_id && sid) parts.push(`Your student ID changed from ${r.student_id} to ${sid}. Download your card again.`);
      changes.push({ r, cohort, group, code, seat, sid, note: parts.join(' ') });
    }
    // Student IDs are unique, so free the ones that move before handing them out again.
    const renum = changes.filter((x) => x.sid !== x.r.student_id).map((x) => x.r.id);
    if (renum.length) await c.query('UPDATE applications SET student_id=NULL WHERE id = ANY($1::bigint[])', [renum]);
    for (const x of changes) {
      await c.query(`UPDATE applications SET cohort_label=$2, group_label=$3, class_code=$4, seat=$5, student_id=$6, placement_note=CASE WHEN $7 <> '' THEN $7 ELSE placement_note END, placement_note_at=CASE WHEN $7 <> '' THEN now() ELSE placement_note_at END, updated_at=now() WHERE id=$1`, [x.r.id, x.cohort, x.group, x.code, x.seat, x.sid, x.note]);
    }
    await c.query('COMMIT');
    return changes.length;
  } catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e; } finally { c.release(); }
}

/** Kept for existing callers: place one applicant by recalculating the whole layout. */
export async function placeApplicant(_id?: number | string): Promise<number> { return repack(); }
export async function placeUnassigned(): Promise<number> { return repack(); }
