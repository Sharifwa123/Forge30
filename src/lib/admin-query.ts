import { q } from './db';

export type Filters = { search?: string; status?: string; location?: string; device?: string; format?: string; period?: string; certificate?: string; contrib?: string; sort?: string };

const SORTS: Record<string, string> = { newest: 'created_at DESC', oldest: 'created_at ASC', name: 'name ASC' };

export function buildWhere(f: Filters) {
  const w: string[] = []; const p: unknown[] = [];
  const push = (v: unknown) => { p.push(v); return `$${p.length}`; };
  if (f.search) { const n = push(`%${f.search}%`); w.push(`(name ILIKE ${n} OR email ILIKE ${n} OR phone ILIKE ${n} OR ref ILIKE ${n})`); }
  if (f.status) w.push(`status = ${push(f.status)}`);
  if (f.location) w.push(`location ILIKE ${push(`%${f.location}%`)}`);
  if (f.device) { const n = push(f.device); w.push(`(data->'device'->>'computer' = ${n} OR data->'device'->>'phone' = ${n})`); }
  if (f.format) w.push(`data->'availability'->>'format' = ${push(f.format)}`);
  if (f.period) w.push(`(data->'availability'->'periods') @> ${push(JSON.stringify([f.period]))}::jsonb`);
  if (f.certificate) w.push(`data->'finish'->>'certificate' = ${push(f.certificate)}`);
  if (f.contrib) w.push(`data->'availability'->>'contribPref' = ${push(f.contrib)}`);
  return { where: w.length ? 'WHERE ' + w.join(' AND ') : '', params: p, order: SORTS[f.sort || ''] || SORTS.newest };
}

export async function listApplications(f: Filters, limit = 500) {
  const { where, params, order } = buildWhere(f);
  return q<any>(`SELECT id, ref, email, phone, name, location, status, data, admin_notes, student_id, serial, seat, group_label, session_time, contact, created_at FROM applications ${where} ORDER BY ${order} LIMIT ${Math.min(limit, 5000)}`, params);
}
