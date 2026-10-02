// Automatic cohort / group / class / seat placement. Runs against a LOCAL database only (it empties the applications table).
import pg from 'pg';
import sharp from 'sharp';
const BASE = process.env.BASE || 'http://localhost:3000';
if (!/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '')) { console.log('SKIP: DATABASE_URL is not local'); process.exit(0); }
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const J = { 'Content-Type': 'application/json', Origin: BASE };
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
await fetch(BASE + '/'); // runs the migrations on a fresh database
await db.query('DELETE FROM applications; DELETE FROM rate_limits');
let n = 0;
const apply = async (experience, format) => {
  const u = String(Date.now()).slice(-6) + String(++n).padStart(3, '0');
  const a = { about: { fullName: 'Place Tester ' + n, phone: '024' + u, email: `pl${u}@example.com`, location: 'Wenchi', ageBracket: '18-24', experience },
    commitment: { why: 'I want to learn to build software for my community.', hopeToBuild: 'A web app for local shops.', canCommit: 'yes', practise: 'yes', seriousness: 'all', ackDiscipline: true },
    availability: { periods: ['evening'], format, ...(format === 'remote' ? {} : { contribPref: 'willing', contribRange: '0' }) }, device: { phone: 'android', computer: 'win_laptop', internet: 'reliable', electricity: 'reliable', workspace: 'yes' }, finish: { certificate: 'yes', budget: 'yes', privacy: true } };
  const r = await fetch(BASE + '/api/apply', { method: 'POST', headers: J, body: JSON.stringify(a) }); const j = await r.json();
  if (!j.ref) console.log('apply failed', r.status, JSON.stringify(j));
  return j.ref;
};
const row = async (ref) => (await db.query('SELECT cohort_label c, group_label g, class_code k, seat s FROM applications WHERE ref=$1', [ref])).rows[0];

const refs = []; for (let i = 0; i < 16; i++) refs.push(await apply('none', 'remote'));
const rows = await Promise.all(refs.map(row));
ok(rows.every((r) => r.c === 'Online' && r.g === 'LCS'), 'remote + no experience -> Online / LCS');
ok(rows.slice(0, 15).every((r) => r.k === 'F30-001') && rows[15].k === 'F30-002', 'first 15 applicants are F30-001, the 16th opens F30-002');
ok(rows.slice(0, 15).map((r) => r.s).join() === Array.from({ length: 15 }, (_, i) => 'B-' + String(i + 1).padStart(2, '0')).join() && rows[15].s === 'B-01', 'seats run B-01 to B-15 per class');
const ip = await row(await apply('some', 'in_person')); ok(ip.c === 'Wenchi CIC' && ip.g === 'ICS' && ip.k === 'F30-003' && ip.s === 'B-01', 'in person + some experience -> Wenchi CIC / ICS, own class');
const ac = await row(await apply('prior', 'remote')); ok(ac.c === 'Online' && ac.g === 'ACS' && ac.k === 'F30-004', 'experienced -> ACS class');
const ei = await row(await apply('basic', 'either')); ok(ei.c === 'Online' && ei.g === 'LCS' && ei.k === 'F30-002' && ei.s === 'B-02', '"either" + basic -> Online / LCS, fills the open seat in F30-002');

// admin: card + dashboard show it; date & time are "coming soon"
const al = await fetch(BASE + '/api/admin/login', { method: 'POST', headers: J, body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }) });
const A = { Cookie: (al.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; ') };
const id = (await db.query('SELECT id FROM applications WHERE ref=$1', [refs[0]])).rows[0].id;
await fetch(`${BASE}/api/admin/applicants/${id}`, { method: 'PATCH', headers: { ...J, ...A }, body: JSON.stringify({ status: 'confirmed' }) });
const st = await fetch(BASE + '/api/status', { method: 'POST', headers: J, body: JSON.stringify({ ref: refs[0], email: (await db.query('SELECT email FROM applications WHERE id=$1', [id])).rows[0].email }) });
const S = { Cookie: (st.headers.getSetCookie() || []).map((c) => c.split(';')[0])[0] };
const html = await (await fetch(BASE + '/dashboard', { headers: S })).text();
ok(/F30-001/.test(html) && /Online/.test(html) && /LCS/.test(html) && /Coming soon/.test(html), 'student dashboard shows cohort, group, class, seat and "Coming soon"');
const tok = decodeURIComponent(/cardToken\\?":\\?"([A-Za-z0-9_\-.%]+)/.exec(html)[1]);
const jpeg = await sharp({ create: { width: 600, height: 800, channels: 3, background: '#8aa9e6' } }).jpeg().toBuffer(); const fd = new FormData(); fd.append('token', tok); fd.append('photo', new File([jpeg], 'p.jpg', { type: 'image/jpeg' })); await fetch(BASE + '/api/card/photo', { method: 'POST', headers: { Origin: BASE }, body: fd });
const img = await fetch(`${BASE}/api/card/image?t=${encodeURIComponent(tok)}&side=front`); ok(img.status === 200 && (await img.arrayBuffer()).byteLength > 5000, 'card renders with the new fields');

// withdrawn applicants free their seat; auto-place picks up unplaced rows
await db.query("UPDATE applications SET class_code='', seat='', group_label='', cohort_label='' WHERE ref=$1", [refs[3]]);
const bulk = await fetch(BASE + '/api/admin/bulk', { method: 'POST', headers: { ...J, ...A }, body: JSON.stringify({ ids: [1], autoPlace: true }) }); ok(bulk.status === 200 && (await bulk.json()).updated === 1, 'admin can auto-place unplaced applicants');
const back = await row(refs[3]); ok(back.k === 'F30-001' && back.s === 'B-04', 'a freed seat is re-used by the next placement');
await db.end(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
