import { Pool } from 'pg';

declare global { var __pool: Pool | undefined; var __migrated: Promise<void> | undefined }

function makePool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const local = /localhost|127\.0\.0\.1/.test(url);
  return new Pool({ connectionString: url, max: 5, ssl: local ? false : { rejectUnauthorized: false } });
}

export const pool = () => (globalThis.__pool ??= makePool());

const DDL = `
CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  ref TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  data JSONB NOT NULL,
  admin_notes TEXT NOT NULL DEFAULT '',
  cohort_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS applications_phone_idx ON applications (phone);
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications (status);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS audit_log (id BIGSERIAL PRIMARY KEY, at TIMESTAMPTZ NOT NULL DEFAULT now(), action TEXT NOT NULL, target TEXT, detail JSONB);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT NOT NULL, at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS rate_limits_key_idx ON rate_limits (key, at);
CREATE TABLE IF NOT EXISTS events (id BIGSERIAL PRIMARY KEY, at TIMESTAMPTZ NOT NULL DEFAULT now(), name TEXT NOT NULL, step TEXT);
`;

export function ready(): Promise<void> {
  return (globalThis.__migrated ??= pool().query(DDL).then(() => undefined).catch((e) => { globalThis.__migrated = undefined; throw e; }));
}

export async function q<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  await ready();
  return (await pool().query(text, params)).rows as T[];
}
