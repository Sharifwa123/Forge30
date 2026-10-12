// Computer-skills / software-development positioning: copy, the goal question, group names. Local database only.
import pg from 'pg';
import sharp from 'sharp';
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

// ---------- budget visible only after admission; card differs only for computer-skills learners
const strip = (x) => x.replace(/<!--.*?-->/g, '');
const apply = strip(await (await fetch(BASE + '/apply')).text());
ok(!h.includes('GH₵500') && !apply.includes('GH₵500') && !h.includes('GH&#x20B5;500'), 'the GH₵500 budget is not on the landing page or application page');
const hasBudgetChunk = async () => { for (const m of (apply + h).matchAll(/\/_next\/static\/[^"']+\.js/g)) { const t = await (await fetch(BASE + m[0])).text(); if (t.includes('approximately GH₵500') || t.includes('GH₵500 for their')) return true; } return false; };
ok(!(await hasBudgetChunk()), 'the budget text is not shipped in the public JavaScript either');
const sc = (res) => (res.headers.getSetCookie() || []).map((c) => c.split(';')[0])[0];
const tokenOf = (html) => decodeURIComponent(/cardToken\\?":\\?"([A-Za-z0-9_\-.%]+)/.exec(html)[1]);
const jpeg = await sharp({ create: { width: 600, height: 800, channels: 3, background: '#8aa9e6' } }).jpeg().toBuffer();
async function student(goal, n) {
  const uu = String(Date.now()).slice(-6) + n;
  const body = mk({ goal, fullName: 'Card ' + goal, phone: '026' + uu.slice(0, 7), email: `card${goal}${uu}@example.com` });
  const r = await (await fetch(BASE + '/api/apply', { method: 'POST', headers: J, body: JSON.stringify(body) })).json();
  const id = (await db.query('SELECT id FROM applications WHERE ref=$1', [r.ref])).rows[0].id;
  const st = await fetch(BASE + '/api/status', { method: 'POST', headers: J, body: JSON.stringify({ ref: r.ref, email: body.about.email }) }); const S = { Cookie: sc(st) };
  const before = strip(await (await fetch(BASE + '/dashboard', { headers: S })).text());
  const project = strip(await (await fetch(BASE + '/dashboard/project', { headers: S })).text());
  await fetch(`${BASE}/api/admin/applicants/${id}`, { method: 'PATCH', headers: { ...J, ...A }, body: JSON.stringify({ status: 'confirmed' }) });
  const after = strip(await (await fetch(BASE + '/dashboard', { headers: S })).text());
  const fd = new FormData(); fd.append('token', tokenOf(after)); fd.append('photo', new File([jpeg], 'p.jpg', { type: 'image/jpeg' })); await fetch(BASE + '/api/card/photo', { method: 'POST', headers: { Origin: BASE }, body: fd });
  const png = Buffer.from(await (await fetch(`${BASE}/api/card/image?t=${encodeURIComponent(tokenOf(after))}&side=front`)).arrayBuffer());
  return { before, project, after, st: await sharp(png).stats(), id };
}
const dev = await student('dev', 1), skl = await student('skills', 2), both = await student('both', 3);
ok(!dev.before.includes('GH₵500') && !dev.before.includes('Your project budget') && !dev.project.includes('GH₵500'), 'a not-yet-admitted student sees no budget (dashboard or project workspace)');
ok(dev.after.includes('Your project budget') && dev.after.includes('GH₵500'), 'once confirmed, the dashboard shows the project budget');
const m = (x) => x.st.channels.map((c) => c.mean);
const diff = Math.max(...m(dev).map((v, i) => Math.abs(v - m(skl)[i])));
ok(diff > 12, 'the computer-skills card looks different from the developer card (colour difference ' + diff.toFixed(0) + ')');
const same = Math.max(...m(dev).map((v, i) => Math.abs(v - m(both)[i])));
ok(same < 3, 'a "both" applicant gets the standard card (only computer-skills learners differ)');
const flip = await fetch(`${BASE}/api/admin/applicants/${both.id}`, { method: 'PATCH', headers: { ...J, ...A }, body: JSON.stringify({ edit: { fullName: 'Card both', email: (await db.query('SELECT email FROM applications WHERE id=$1', [both.id])).rows[0].email, phone: (await db.query('SELECT phone FROM applications WHERE id=$1', [both.id])).rows[0].phone, location: 'Wenchi', goal: 'skills' } }) });
ok(flip.status === 200 && (await db.query("SELECT data->'about'->>'goal' g FROM applications WHERE id=$1", [both.id])).rows[0].g === 'skills', 'admin can change an applicant’s goal (which switches their card)');
await db.end(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
