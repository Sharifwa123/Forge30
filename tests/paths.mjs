// Computer-skills / software-development positioning: copy, the goal question, group names. Local database only.
import pg from 'pg';
const BASE = process.env.BASE || 'http://localhost:3000';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const J = { 'Content-Type': 'application/json', Origin: BASE };
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
await db.query('DELETE FROM rate_limits');
const h = await (await fetch(BASE + '/')).text();
ok(h.includes('Pick your path') && h.includes('Skills Forge') && h.includes('computer skills'), 'landing welcomes computer-skills learners and names both paths');
ok(!/Developer Forge|developer program/i.test(h), 'landing no longer calls FORGE30 a developer-only program');
ok(h.includes('LCS, ICS or ACS'), 'landing explains the LCS / ICS / ACS groups');
ok(h.includes('Do I have to become a developer?'), 'FAQ answers "do I have to become a developer?"');

const u = String(Date.now()).slice(-8);
const mk = (about) => ({ about: { fullName: 'Skills Learner', phone: '024' + u.slice(0, 7), email: `sk${u}@example.com`, location: 'Wenchi', ageBracket: '25-34', experience: 'none', ...about },
  commitment: { why: 'I want to be confident using a computer for my small business.', hopeToBuild: 'Keep my records in a spreadsheet.', canCommit: 'yes', practise: 'yes', seriousness: 'all', ackDiscipline: true },
  availability: { periods: ['evening'], format: 'remote' }, device: { phone: 'android', computer: 'win_laptop', internet: 'reliable', electricity: 'reliable', workspace: 'yes' }, finish: { certificate: 'yes', budget: 'yes', privacy: true } });
const missing = await fetch(BASE + '/api/apply', { method: 'POST', headers: J, body: JSON.stringify(mk({})) }); const mj = await missing.json();
ok(missing.status === 422 && !!mj.fields?.['about.goal'], 'the goal question is required');
const good = await fetch(BASE + '/api/apply', { method: 'POST', headers: J, body: JSON.stringify(mk({ goal: 'skills' })) }); const gj = await good.json();
ok(good.status === 200 && !!gj.ref, 'a computer-skills applicant can apply');
const row = (await db.query("SELECT group_label g, data->'about'->>'goal' goal FROM applications WHERE ref=$1", [gj.ref])).rows[0];
ok(row.goal === 'skills' && row.g === 'LCS', 'goal is stored and the applicant is placed by level (LCS)');

const al = await fetch(BASE + '/api/admin/login', { method: 'POST', headers: J, body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }) }); const A = { Cookie: (al.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; ') };
const csv = await (await fetch(BASE + '/api/admin/export', { headers: A })).text(); ok(csv.includes('"Goal"') && csv.includes('Computer skills'), 'admin export includes the goal');
const filtered = await (await fetch(BASE + '/admin?goal=skills', { headers: A })).text(); ok(filtered.includes('Skills Learner'), 'admin can filter by goal');
const st = await fetch(BASE + '/api/status', { method: 'POST', headers: J, body: JSON.stringify({ ref: gj.ref, email: `sk${u}@example.com` }) });
const dash = await (await fetch(BASE + '/dashboard', { headers: { Cookie: (st.headers.getSetCookie() || []).map((c) => c.split(';')[0])[0] } })).text();
ok(dash.includes('LCS') && dash.includes('Low Computer Skills'), 'dashboard shows the group with its full name');
await db.end(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
