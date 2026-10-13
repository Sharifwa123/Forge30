// Seats, classes and student IDs close up when someone is withdrawn or deleted, and students are told. Local database only (empties applications).
import pg from 'pg';
import sharp from 'sharp';
const BASE = process.env.BASE || 'http://localhost:3000';
if (!/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '')) { console.log('SKIP: DATABASE_URL is not local'); process.exit(0); }
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const J = { 'Content-Type': 'application/json', Origin: BASE };
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
await fetch(BASE + '/'); await db.query('DELETE FROM applications; DELETE FROM rate_limits');
const al = await fetch(BASE + '/api/admin/login', { method: 'POST', headers: J, body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }) }); const A = { Cookie: (al.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; ') };
let n = 0;
const apply = async (experience = 'none', format = 'remote') => {
  const u = String(Date.now()).slice(-6) + String(++n).padStart(3, '0');
  const a = { about: { fullName: 'Shift Tester ' + n, phone: '027' + u, email: `sh${u}@example.com`, location: 'Wenchi', ageBracket: '18-24', goal: 'both', experience },
    commitment: { why: 'I want to learn to build software for my community.', hopeToBuild: 'A web app for local shops.', canCommit: 'yes', practise: 'yes', seriousness: 'all', ackDiscipline: true },
    availability: { periods: ['evening'], format, ...(format === 'remote' ? {} : { contribPref: 'willing', contribRange: '0' }) }, device: { phone: 'android', computer: 'win_laptop', internet: 'reliable', electricity: 'reliable', workspace: 'yes' }, finish: { certificate: 'yes', privacy: true } };
  const r = await fetch(BASE + '/api/apply', { method: 'POST', headers: J, body: JSON.stringify(a) });
  const j = await r.json(); const cookie = (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; ');
  return { ref: j.ref, id: (await db.query('SELECT id FROM applications WHERE ref=$1', [j.ref])).rows[0].id, cookie };
};
const row = async (x) => (await db.query('SELECT status, class_code k, seat s, student_id sid, placement_note note FROM applications WHERE id=$1', [x.id])).rows[0];
const patch = (x, b) => fetch(`${BASE}/api/admin/applicants/${x.id}`, { method: 'PATCH', headers: { ...J, ...A }, body: JSON.stringify(b) });
const seats = async (...xs) => (await Promise.all(xs.map(async (x) => { const r = await row(x); return r.k + '/' + r.s; }))).join(' ');

const a = await apply(), b = await apply(), c = await apply(), d = await apply('prior');
ok(await seats(a, b, c) === 'F30-001/B-01 F30-001/B-02 F30-001/B-03', 'three applicants in one group get B-01, B-02, B-03 in class F30-001');
ok(await seats(d) === 'F30-002/B-01', 'a different group starts its own class (F30-002, B-01)');

// withdraw the first: everyone after moves up, and is told
await patch(a, { status: 'withdrawn' });
ok(await seats(b, c) === 'F30-001/B-01 F30-001/B-02', 'withdrawing the first applicant moves the others up');
ok((await row(a)).k === '' && (await row(a)).s === '', 'the withdrawn applicant no longer holds a class or seat');
ok(/B-02 is now F30-001 · B-01/.test((await row(b)).note || ''), 'the person who moved up gets a note explaining the change');
ok((await row(d)).note === '', 'someone whose place did not move gets no note');
const dash = await (await fetch(BASE + '/dashboard', { headers: { Cookie: b.cookie } })).text();
ok(dash.includes('Your place has moved') && dash.includes('F30-001'), 'the student sees the change on their dashboard');

// bring the first back: they do NOT take their old place back, they join the end of the queue (next free seat)
await patch(a, { status: 'submitted' });
ok(await seats(b, c, a) === 'F30-001/B-01 F30-001/B-02 F30-001/B-03', 're-instating the first applicant puts them at the end: nobody else is pushed down');

// delete the one at the front: the others move up
await fetch(`${BASE}/api/admin/applicants/${b.id}`, { method: 'DELETE', headers: { ...J, ...A } });
ok(await seats(c, a) === 'F30-001/B-01 F30-001/B-02', 'deleting an applicant moves the others up');

// student IDs: gapless, in confirmation order, and they close up too
await patch(c, { status: 'confirmed' }); await patch(a, { status: 'confirmed' }); await patch(d, { status: 'confirmed' });
const ids = async (...xs) => (await Promise.all(xs.map(async (x) => (await row(x)).sid.slice(-4)))).join(' ');
ok(await ids(c, a, d) === '0001 0002 0003', 'student IDs run 0001, 0002, 0003 in confirmation order with no gaps');
await patch(c, { status: 'withdrawn' });
ok(await ids(a, d) === '0001 0002', 'withdrawing a confirmed student closes the gap in student IDs');
ok(/student ID changed/i.test((await row(d)).note || ''), 'students whose ID changed are told');

// a hand-placed (pinned) applicant is left alone by re-sorting
const e = await apply(); await patch(e, { classCode: 'F30-009', seat: 'B-07' });
await patch(a, { adminNotes: 'x' });
ok(await seats(e) === 'F30-009/B-07', 'an applicant placed by hand keeps their class and seat when others change');
await patch(e, { unpin: true });
{ const [re, ra] = [await row(e), await row(a)]; ok(re.k === ra.k && re.s !== ra.s && re.k !== 'F30-009', 'an admin can put them back on automatic placement (they join their group’s class at the next free seat)'); }

// two people applying at the same moment never share a seat
const burst = await Promise.all([apply(), apply(), apply(), apply(), apply()]);
const got = (await Promise.all(burst.map(row))).map((r) => r.k + '/' + r.s); ok(new Set(got).size === got.length, 'five simultaneous applications get five different seats');

// photo taken with the application
const jpeg = await sharp({ create: { width: 600, height: 800, channels: 3, background: '#8aa9e6' } }).jpeg().toBuffer();
const fd = new FormData(); fd.append('photo', new File([jpeg], 'p.jpg', { type: 'image/jpeg' }));
const up = await fetch(BASE + '/api/student/photo', { method: 'POST', headers: { Origin: BASE, Cookie: burst[0].cookie }, body: fd });
ok(up.status === 200 && (await db.query('SELECT photo IS NOT NULL p FROM applications WHERE id=$1', [burst[0].id])).rows[0].p, 'the photo sent with the application is stored for the card');
const noSession = await fetch(BASE + '/api/student/photo', { method: 'POST', headers: { Origin: BASE }, body: fd }); ok(noSession.status === 401, 'the photo endpoint needs the applicant’s session');

// applicants who applied before the photo step (waiting for confirmation) are asked for it, and admin can see who is missing
const w = await apply(); await db.query('UPDATE applications SET photo=NULL, photo_at=NULL WHERE id=$1', [w.id]);
const wd = await (await fetch(BASE + '/dashboard', { headers: { Cookie: w.cookie } })).text();
ok(wd.includes('Add your passport photo') && wd.includes('One thing left'), 'a waiting applicant without a photo is asked for it on their dashboard');
const fd2 = new FormData(); fd2.append('photo', new File([jpeg], 'p.jpg', { type: 'image/jpeg' }));
await fetch(BASE + '/api/student/photo', { method: 'POST', headers: { Origin: BASE, Cookie: w.cookie }, body: fd2 });
const wd2 = await (await fetch(BASE + '/dashboard', { headers: { Cookie: w.cookie } })).text(); ok(!wd2.includes('One thing left'), 'once they add it, the request disappears');
await db.query('UPDATE applications SET photo=NULL, photo_at=NULL WHERE id=$1', [w.id]);
const miss = await (await fetch(BASE + '/admin?photo=missing', { headers: A })).text(); ok(miss.includes(`/admin/applicants/${w.id}`), 'admin can filter applicants who have no photo yet');
await db.end(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
