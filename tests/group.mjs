// The permanent "Join the WhatsApp group" button, controlled from admin. Local database only.
import pg from 'pg';
const BASE = process.env.BASE || 'http://localhost:3000';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const J = { 'Content-Type': 'application/json', Origin: BASE };
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
await fetch(BASE + '/'); await db.query('DELETE FROM rate_limits');
const al = await fetch(BASE + '/api/admin/login', { method: 'POST', headers: J, body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }) }); const A = { Cookie: (al.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; ') };
const settings = (b) => fetch(BASE + '/api/admin/settings', { method: 'POST', headers: { ...J, ...A }, body: JSON.stringify(b) });
const land = async () => (await fetch(BASE + '/')).text();
const LINK = 'https://chat.whatsapp.com/TestInvite123';

await settings({ groupButton: false, whatsappGroupUrl: LINK, groupButtonLabel: 'Join the WhatsApp group' });
ok(!(await land()).includes(LINK + '"') && !(await land()).includes('btn-wa'), 'with the switch off, the join button is not shown');
await settings({ groupButton: true, whatsappGroupUrl: '' });
ok(!(await land()).includes('btn-wa'), 'switched on but with no link, nothing is shown');
ok((await settings({ whatsappGroupUrl: 'javascript:alert(1)' })).status === 400, 'an unsafe link is rejected');
await settings({ groupButton: true, whatsappGroupUrl: LINK, groupButtonLabel: 'Chat with the class group' });
const h = await land();
ok(h.includes(LINK) && h.includes('Chat with the class group') && h.includes('btn-wa'), 'switched on with a link, the button shows with the admin’s wording');
ok((h.match(/class="btn btn-wa/g) || []).length >= 2, 'it appears in the hero and on the last explorer card');
ok(h.includes('noopener'), 'the link opens safely in a new tab');

// application confirmation + dashboard
const u = String(Date.now()).slice(-8);
const a = { about: { fullName: 'Group Tester', phone: '023' + u.slice(0, 7), email: `gr${u}@example.com`, location: 'Wenchi', ageBracket: '18-24', goal: 'both', experience: 'none' }, commitment: { why: 'I want to learn to build software for my community.', hopeToBuild: 'A web app for local shops.', canCommit: 'yes', practise: 'yes', seriousness: 'all', ackDiscipline: true }, availability: { periods: ['evening'], format: 'remote' }, device: { phone: 'android', computer: 'win_laptop', internet: 'reliable', electricity: 'reliable', workspace: 'yes' }, finish: { certificate: 'yes', privacy: true } };
const r = await fetch(BASE + '/api/apply', { method: 'POST', headers: J, body: JSON.stringify(a) }); const cookie = (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; ');
const dash = await (await fetch(BASE + '/dashboard', { headers: { Cookie: cookie } })).text();
ok(dash.includes('Our WhatsApp group') && dash.includes(LINK), 'students see the group button on their dashboard');

await settings({ groupButton: false });
ok(!(await land()).includes('btn-wa'), 'switching it off in admin removes it from the site again');
const dash2 = await (await fetch(BASE + '/dashboard', { headers: { Cookie: cookie } })).text(); ok(!dash2.includes('Our WhatsApp group'), '…and from student dashboards');
const adm = await (await fetch(BASE + '/admin/settings', { headers: A })).text(); ok(adm.includes('Show the join button on the site') && adm.includes('Group invite link'), 'admin has the switch, link and wording fields');
await settings({ groupButton: false, whatsappGroupUrl: '', groupButtonLabel: 'Join the WhatsApp group' });
await db.end(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
