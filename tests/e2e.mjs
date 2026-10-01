// End-to-end API test. Run against a running server: BASE=http://localhost:3000 ADMIN_PASSWORD=... node tests/e2e.mjs
const BASE = process.env.BASE || 'http://localhost:3000';
const PW = process.env.ADMIN_PASSWORD;
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const post = (p, body, h = {}) => fetch(BASE + p, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: BASE, ...h }, body: JSON.stringify(body) });
const uniq = Date.now().toString().slice(-8);
const valid = (over = {}) => ({
  about: { fullName: 'Ama Mensah', preferredName: 'Ama', phone: '024' + uniq.slice(0, 7), email: `ama${uniq}@example.com`, location: 'Kumasi, Ashanti', ageBracket: '18-24', experience: 'none' },
  commitment: { why: 'I want to build software that solves real problems in my community.', hopeToBuild: 'A small web app for local shops to track customers.', canCommit: 'yes', practise: 'yes', seriousness: 'all', ackDiscipline: true },
  availability: { periods: ['evening'], format: 'either', contribPref: 'flexible', contribRange: '50-100' },
  device: { phone: 'android', computer: 'none', sharedComputer: 'maybe', internet: 'mobile_data', electricity: 'reliable', workspace: 'yes' },
  finish: { certificate: 'yes', budget: 'yes', privacy: true },
  ...over,
});

let r = await post('/api/apply', valid());
let j = await r.json();
ok(r.status === 200 && /^F30-[0-9A-F]{8}$/.test(j.ref), 'valid application accepted, ref ' + j.ref);
const ref = j.ref, email = `ama${uniq}@example.com`;

r = await post('/api/apply', valid());
ok(r.status === 409, 'duplicate application rejected (409)');

const bad = valid(); bad.about = { ...bad.about, email: 'not-an-email', phone: '12', fullName: '' };
r = await post('/api/apply', bad); j = await r.json();
ok(r.status === 422 && j.fields['about.email'] && j.fields['about.phone'] && j.fields['about.fullName'], 'invalid email/phone/name -> 422 with field errors');

const no = valid(); no.commitment.canCommit = 'no';
r = await post('/api/apply', no);
ok(r.status === 422, 'canCommit=no cannot be submitted (server-side)');

const noAck = valid(); noAck.commitment.ackDiscipline = false;
ok((await post('/api/apply', noAck)).status === 422, 'discipline acknowledgement required server-side');

const inp = valid(); inp.about.email = `xss${uniq}@example.com`; inp.about.phone = '025' + uniq.slice(0, 7); inp.about.fullName = '<script>alert(1)</script>Kofi'; inp.about.preferredName = '=HYPERLINK("http://evil.example","click")';
r = await post('/api/apply', inp);
ok(r.status === 200, 'malicious strings accepted as inert text (sanitised / parameterised)');

const rem = valid(); rem.about.email = `rem${uniq}@example.com`; rem.about.phone = '026' + uniq.slice(0, 7); rem.availability = { periods: ['morning'], format: 'remote' }; rem.device.computer = 'win_laptop'; delete rem.device.sharedComputer;
ok((await post('/api/apply', rem)).status === 200, 'remote applicant needs no contribution answers (conditional logic)');

const inpNoContrib = valid(); inpNoContrib.about.email = `ip${uniq}@example.com`; inpNoContrib.about.phone = '027' + uniq.slice(0, 7); delete inpNoContrib.availability.contribPref;
ok((await post('/api/apply', inpNoContrib)).status === 422, 'in-person/either applicant must answer contribution (conditional)');

ok((await fetch(BASE + '/api/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status === 403, 'missing Origin rejected (CSRF)');
ok((await fetch(BASE + '/api/apply', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' }, body: '{}' })).status === 403, 'cross-origin rejected (CSRF)');
ok((await post('/api/apply', { junk: 'x'.repeat(70000) })).status === 413, 'oversized body rejected');

r = await post('/api/status', { ref, email }); j = await r.json();
ok(r.status === 200 && j.status === 'submitted', 'status lookup with ref+email');
ok((await post('/api/status', { ref, email: 'other@example.com' })).status === 404, 'status lookup with wrong email -> 404');

// admin
ok((await fetch(BASE + '/api/admin/export')).status === 401, 'export requires admin');
ok((await fetch(BASE + '/api/admin/applicants/1', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Origin: BASE }, body: '{"status":"selected"}' })).status === 401, 'patch requires admin');
ok((await post('/api/admin/bulk', { ids: [1], status: 'selected' })).status === 401, 'bulk requires admin');
ok((await post('/api/admin/settings', { applicationsOpen: false })).status === 401, 'settings require admin');
if (PW) {
  r = await post('/api/admin/login', { password: PW });
  const cookie = (r.headers.get('set-cookie') || '').split(';')[0];
  ok(r.status === 200 && cookie.startsWith('f30_admin='), 'admin login sets cookie');
  const A = { Cookie: cookie };
  const page = await (await fetch(BASE + '/admin', { headers: A })).text();
  ok(page.includes('Ama Mensah') || page.includes('applicants'), 'admin list page renders for admin');
  const filt = await (await fetch(BASE + '/admin?device=none&format=either&period=evening', { headers: A })).text();
  ok(filt.includes('Ama Mensah'), 'filters (device/format/availability) find the applicant');
  const filt2 = await (await fetch(BASE + '/admin?location=Accra', { headers: A })).text();
  ok(!filt2.includes('Ama Mensah'), 'location filter excludes non-matching applicant');
  const csv = await (await fetch(BASE + '/api/admin/export?search=Ama', { headers: A })).text();
  ok(csv.includes(ref) && csv.includes('Ama Mensah'), 'CSV export works');
  const all = await (await fetch(BASE + '/api/admin/export', { headers: A })).text();
  ok(all.includes('"\'=HYPERLINK(') && !all.includes('"=HYPERLINK('), 'CSV export neutralises spreadsheet formula injection');
  ok(!all.includes('<script>'), 'angle brackets stripped from stored text');
  const one = await (await fetch(BASE + '/admin?search=' + ref, { headers: A })).text();
  const idm = /\/admin\/applicants\/(\d+)/.exec(one)?.[1];
  r = await fetch(BASE + '/api/admin/applicants/' + idm, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Origin: BASE, ...A }, body: JSON.stringify({ status: 'under_review', adminNotes: 'Strong motivation' }) });
  ok(r.status === 200, 'admin status change + note');
  r = await post('/api/status', { ref, email }); j = await r.json();
  ok(j.status === 'under_review' && !JSON.stringify(j).includes('Strong motivation'), 'applicant sees new status, never internal notes');
  r = await post('/api/admin/bulk', { ids: [Number(idm)], status: 'selected' }, A);
  ok(r.status === 200, 'bulk status change');
  r = await fetch(BASE + '/api/admin/applicants/' + idm, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...A }, body: '{"status":"selected"}' });
  ok(r.status === 403, 'admin mutation without Origin blocked (CSRF)');
  r = await post('/api/admin/settings', { applicationsOpen: false }, A);
  ok(r.status === 200, 'admin closes applications');
  r = await post('/api/apply', valid({ about: { ...valid().about, email: `late${uniq}@example.com`, phone: '028' + uniq.slice(0, 7) } }));
  ok(r.status === 403, 'submission refused while applications closed');
  { const h = await (await fetch(BASE + '/')).text(); ok(h.includes('Applications are closed for now') && !h.includes('APPLY FOR THE COHORT'), 'landing page reflects closed state (note shown, apply button replaced)'); ok(!/APPLICATIONS (OPEN|CLOSED)/.test(h), 'no status badge is rendered'); }
  await post('/api/admin/settings', { applicationsOpen: true }, A);
  { const h = await (await fetch(BASE + '/')).text(); ok(h.includes('APPLY FOR THE COHORT') && !h.includes('Applications are closed for now'), 'applications re-opened (apply button back, no closed note)'); }
  const forged = await fetch(BASE + '/admin', { headers: { Cookie: 'f30_admin=9999999999.abc.forged' }, redirect: 'manual' });
  ok(forged.status === 307, 'forged session cookie rejected');
}
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
process.exit(fails ? 1 : 0);
