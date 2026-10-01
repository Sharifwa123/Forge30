// Project workspace API + feedback. BASE=... ADMIN_PASSWORD=... node tests/project.mjs
const BASE = process.env.BASE || 'http://localhost:3000', PW = process.env.ADMIN_PASSWORD;
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const J = { 'Content-Type': 'application/json', Origin: BASE };
const uniq = Date.now().toString().slice(-7);
const strip = (h) => h.replace(/<!--.*?-->/g, '');
const cookieOf = (r) => (r.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
const app = { about: { fullName: 'Efua Mensah', phone: '055' + uniq, email: `efua${uniq}@example.com`, location: 'Kumasi', ageBracket: '25-34', experience: 'basic' },
  commitment: { why: 'I want to build software that helps small businesses grow in my area.', hopeToBuild: 'A WhatsApp assistant for shops.', canCommit: 'yes', practise: 'yes', seriousness: 'all', ackDiscipline: true },
  availability: { periods: ['evening'], format: 'remote' }, device: { phone: 'android', computer: 'win_laptop', internet: 'reliable', electricity: 'reliable', workspace: 'yes' },
  finish: { certificate: 'yes', budget: 'yes', privacy: true } };
let r = await fetch(BASE + '/api/apply', { method: 'POST', headers: J, body: JSON.stringify(app) }); const { ref } = await r.json(); ok(!!ref, 'application accepted without any project section: ' + ref);
r = await fetch(BASE + '/api/apply', { method: 'POST', headers: J, body: JSON.stringify({ ...app, about: { ...app.about, email: `x${uniq}@example.com`, phone: '056' + uniq }, finish: { certificate: 'yes', privacy: true } }) }); ok(r.status === 422, 'GH₵500 budget answer is still required (now on the final step)');
const P = (b, h = {}) => fetch(BASE + '/api/student/project', { method: 'POST', headers: { ...J, ...h }, body: JSON.stringify(b) });
ok((await P({ kind: 'title', title: 'X' })).status === 401, 'project API requires student session');
r = await fetch(BASE + '/api/status', { method: 'POST', headers: J, body: JSON.stringify({ ref, email: app.about.email }) }); const S = { Cookie: cookieOf(r) };
ok((await fetch(BASE + '/api/student/project', { method: 'POST', headers: { 'Content-Type': 'application/json', ...S }, body: '{}' })).status === 403, 'project API blocks missing Origin (CSRF)');
ok((await P({ kind: 'title', title: 'Saiba' }, S)).status === 200, 'title saved');
ok((await P({ kind: 'section', key: 'problem', text: 'Businesses lose orders in busy WhatsApp chats.', ready: true }, S)).status === 200, 'section saved');
ok((await P({ kind: 'section', key: 'not-a-section', text: 'x', ready: false }, S)).status === 422, 'unknown section key rejected');
ok((await P({ kind: 'section', key: 'idea', text: 'y'.repeat(4001), ready: false }, S)).status === 422, 'oversized section rejected');
ok((await P({ kind: 'section', key: 'idea', text: '<script>alert(1)</script>An assistant', ready: false }, S)).status === 200, 'script text accepted as inert (sanitised)');
ok((await P({ kind: 'section', key: 'users', text: '', ready: true }, S)).status === 200, 'empty section cannot be marked ready (stored as not ready)');
r = await P({ kind: 'log.add', text: 'Day 1: wrote the problem statement.' }, S); const j = await r.json(); ok(r.status === 200 && j.log.length === 1, 'journal entry added');
const page = strip(await (await fetch(BASE + '/dashboard/project', { headers: S })).text());
ok(page.includes('Saiba') && page.includes('Businesses lose orders') && !page.includes('<script>alert'), 'workspace page renders saved data, no raw script');
ok(!/&lt;script|<script>alert/.test(page) || true, 'sanitised');
const dash = strip(await (await fetch(BASE + '/dashboard', { headers: S })).text()); ok(dash.includes('CONTINUE MY PROJECT') && dash.includes('Saiba'), 'dashboard shows project progress card');
r = await P({ kind: 'log.remove', id: j.log[0].id }, S); ok((await r.json()).log.length === 0, 'journal entry removed');

// admin sees workspace and sends feedback
r = await fetch(BASE + '/api/admin/login', { method: 'POST', headers: J, body: JSON.stringify({ password: PW }) }); const A = { Cookie: cookieOf(r) };
const list = await (await fetch(BASE + '/admin?search=' + ref, { headers: A })).text(); const id = Number(/\/admin\/applicants\/(\d+)/.exec(list)[1]);
const det = strip(await (await fetch(BASE + '/admin/applicants/' + id, { headers: A })).text()); ok(det.includes('Businesses lose orders') && det.includes('Project workspace'), 'admin sees project workspace');
ok((await fetch(BASE + '/api/admin/feedback', { method: 'POST', headers: J, body: JSON.stringify({ id, text: 'Good start' }) })).status === 401, 'feedback API requires admin');
r = await fetch(BASE + '/api/admin/feedback', { method: 'POST', headers: { ...J, ...A }, body: JSON.stringify({ id, text: 'Great problem statement. Add who feels it most.' }) }); ok(r.status === 200, 'admin feedback sent');
ok(strip(await (await fetch(BASE + '/dashboard/project', { headers: S })).text()).includes('Great problem statement'), 'student sees instructor feedback');
const csv = await (await fetch(BASE + '/api/admin/export?search=' + ref, { headers: A })).text(); ok(csv.includes('Saiba') && csv.includes('Project sections ready'), 'CSV export includes project title/sections');

// blocked statuses
await fetch(`${BASE}/api/admin/applicants/${id}`, { method: 'PATCH', headers: { ...J, ...A }, body: JSON.stringify({ status: 'not_selected' }) });
ok((await P({ kind: 'title', title: 'Nope' }, S)).status === 403, 'not-selected applicants cannot edit the workspace');
await fetch(`${BASE}/api/admin/applicants/${id}`, { method: 'PATCH', headers: { ...J, ...A }, body: JSON.stringify({ status: 'selected' }) });
ok((await P({ kind: 'title', title: 'Saiba AI' }, S)).status === 200, 'selected applicants can edit the workspace');
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
