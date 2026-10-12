// "Interested" sign-up, plain-language intro, WhatsApp chat button, admin interested list. Local database only.
import pg from 'pg';
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:3000', PW = process.env.ADMIN_PASSWORD;
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const J = { 'Content-Type': 'application/json', Origin: BASE };
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
await fetch(BASE + '/');
await db.query('DELETE FROM interests; DELETE FROM rate_limits');
const al = await fetch(BASE + '/api/admin/login', { method: 'POST', headers: J, body: JSON.stringify({ password: PW }) }); const A = { Cookie: (al.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; ') };
const settings = (b) => fetch(BASE + '/api/admin/settings', { method: 'POST', headers: { ...J, ...A }, body: JSON.stringify(b) });
const post = (b, h = J) => fetch(BASE + '/api/interest', { method: 'POST', headers: h, body: JSON.stringify(b) });
const org = { name: 'SHARIF TECHNOLOGIES', title: 'Founder', bio: 'x', website: 'https://www.shariftechnologies.online', location: 'Wenchi', email: '', phone: '', whatsapp: '' };

// landing copy
await settings({ organizer: { ...org, whatsapp: '' }, whatsappGroupUrl: '' });
let h = await (await fetch(BASE + '/')).text();
ok(h.includes('A live program that teaches you real skills in 30 days') && h.includes('Choose your path') && h.includes('Leave your WhatsApp number'), 'landing shows the plain-language intro and the interest form');
ok(!h.includes('CHAT WITH US ON WHATSAPP'), 'no WhatsApp chat button until a number is set');
await settings({ organizer: { ...org, whatsapp: '0241234567' } });
h = await (await fetch(BASE + '/')).text();
ok(h.includes('CHAT WITH US ON WHATSAPP') && h.includes('https://wa.me/233241234567'), 'WhatsApp chat button appears with the international wa.me link');

// API validation
ok((await post({ name: 'A', whatsapp: '0241234567' })).status === 400, 'name too short rejected');
ok((await post({ name: 'Ama Mensah', whatsapp: '12' })).status === 400, 'invalid number rejected');
ok((await post({ name: 'Ama Mensah', whatsapp: '0241234567' }, { 'Content-Type': 'application/json', Origin: 'https://evil.example' })).status === 403, 'cross-origin request blocked');
ok((await settings({ whatsappGroupUrl: 'javascript:alert(1)' })).status === 400, 'unsafe group link rejected');
await settings({ whatsappGroupUrl: 'https://chat.whatsapp.com/ABC123' });
const good = await post({ name: 'Ama Mensah', whatsapp: '024 123 4567' }); const gj = await good.json();
ok(good.status === 200 && gj.groupUrl === 'https://chat.whatsapp.com/ABC123', 'valid sign-up saved and the group link is returned');
await post({ name: 'Ama M', whatsapp: '0241234567' });
ok((await db.query('SELECT count(*) n FROM interests')).rows[0].n === '1', 'the same number is stored once (updated, not duplicated)');

// browser: form on mobile + admin list
const d = '/opt/pw-browsers'; const exe = `${d}/${readdirSync(d).find((x) => x.startsWith('chromium-'))}/chrome-linux/chrome`;
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
await p.goto(BASE + '/#join', { waitUntil: 'networkidle' }); // the form lives on the last explorer card
await p.locator('#int-name').fill('Kofi Boateng'); await p.locator('#int-wa').fill('0551112223'); await p.getByRole('button', { name: /KEEP ME UPDATED/ }).tap();
await p.getByText('Thank you, Kofi').waitFor({ timeout: 8000 });
ok(await p.getByRole('link', { name: 'JOIN THE WHATSAPP GROUP' }).count() === 1, 'sign-up confirmation shows the WhatsApp group link');
const w = await p.evaluate(() => document.documentElement.scrollWidth); ok(w <= 360, 'no horizontal overflow at 360px');
const actx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const ap = await actx.newPage();
await ap.goto(BASE + '/admin/login'); await ap.fill('#pw', PW); await ap.getByRole('button', { name: 'SIGN IN' }).click(); await ap.waitForURL('**/admin');
await ap.goto(BASE + '/admin/interests', { waitUntil: 'networkidle' });
ok(await ap.getByText('Kofi Boateng').count() === 1 && await ap.getByText('Ama M').count() === 1, 'admin sees the interested people');
await ap.getByLabel('Contacted Kofi Boateng').click(); await ap.waitForTimeout(800);
ok((await db.query("SELECT contacted FROM interests WHERE name='Kofi Boateng'")).rows[0].contacted === true, 'admin can mark someone as contacted');
const csv = await (await fetch(BASE + '/api/admin/interests', { headers: A })).text(); ok(csv.includes('Kofi Boateng') && csv.includes('"WhatsApp"'), 'admin can export the list');
await ap.getByRole('row', { name: /Ama M/ }).getByRole('button', { name: 'Remove' }).click(); await ap.getByRole('dialog').getByRole('button', { name: 'Remove' }).click(); await ap.waitForTimeout(800);
ok((await db.query('SELECT count(*) n FROM interests')).rows[0].n === '1', 'admin can remove an entry');
await browser.close();
await settings({ whatsappGroupUrl: '', organizer: { ...org, whatsapp: '' } }); await db.query('DELETE FROM interests');
await db.end(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
