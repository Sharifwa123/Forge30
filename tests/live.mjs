// Notices/announcements on the public site, the reopen-and-clear flow, and live updates of an open student dashboard + card.
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
import sharp from 'sharp';
const BASE = process.env.BASE || 'http://localhost:3000', PW = process.env.ADMIN_PASSWORD;
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const J = { 'Content-Type': 'application/json', Origin: BASE };
const cookieOf = (r) => (r.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]);
const d = '/opt/pw-browsers'; const exe = `${d}/${readdirSync(d).find((x) => x.startsWith('chromium-'))}/chrome-linux/chrome`;
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });

const al = await fetch(BASE + '/api/admin/login', { method: 'POST', headers: J, body: JSON.stringify({ password: PW }) }); const A = { Cookie: cookieOf(al).join('; ') };
const settings = (b) => fetch(BASE + '/api/admin/settings', { method: 'POST', headers: { ...J, ...A }, body: JSON.stringify(b) });
const landing = async () => (await fetch(BASE + '/')).text();
await settings({ notice: '', applicationsOpen: true, maxApplications: 0, cohortName: 'FORGE30 — first cohort', clearAnnouncements: true }); // known starting state, even after an aborted run

// ---------- 1. notice AND announcement both show (previously the announcement was hidden by the notice)
await settings({ notice: 'NOTICE-ONE class registration closes Friday' });
await settings({ addAnnouncement: 'ANNOUNCE-ONE orientation is on Monday' });
let h = await landing();
ok(h.includes('NOTICE-ONE') && h.includes('ANNOUNCE-ONE'), 'landing page shows the notice AND the announcement together');
await settings({ notice: '' }); h = await landing();
ok(!h.includes('NOTICE-ONE') && h.includes('ANNOUNCE-ONE'), 'removing the notice leaves the announcement showing');

// ---------- 2. admin screen: save/remove notice with its own buttons; reopen asks about the notice
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
let native = 0; p.on('dialog', (x) => { native++; x.dismiss(); });
await p.goto(BASE + '/admin/login'); await p.fill('#pw', PW); await p.getByRole('button', { name: 'SIGN IN' }).click(); await p.waitForURL('**/admin');
await p.goto(BASE + '/admin/settings', { waitUntil: 'networkidle' });
await p.fill('#notice', 'NOTICE-TWO we are closed for now'); await p.getByRole('button', { name: 'Save notice' }).click(); await p.getByText('Notice saved').waitFor();
ok((await landing()).includes('NOTICE-TWO'), 'Save notice publishes it on the site');
ok(await p.getByLabel('Currently live on the site').getByText('NOTICE-TWO').count() === 1, 'admin shows what is live on the site right now');
await p.getByRole('button', { name: 'Remove notice' }).click(); await p.getByText('Notice removed').waitFor();
ok(!(await landing()).includes('NOTICE-TWO'), 'Remove notice takes it off the site');
// close, set a notice, re-open with the box ticked
await p.getByRole('button', { name: 'Close applications' }).click(); await p.getByRole('dialog').getByRole('button', { name: 'Close applications' }).click(); await p.getByText('CLOSED', { exact: true }).waitFor();
await p.fill('#notice', 'NOTICE-THREE applications are closed'); await p.getByRole('button', { name: 'Save notice' }).click(); await p.getByText('Notice saved').waitFor();
await p.getByRole('button', { name: 'Re-open applications' }).click(); const dlg = p.getByRole('dialog');
await dlg.getByRole('heading', { name: 'Re-open applications?' }).waitFor();
ok(await dlg.getByText('NOTICE-THREE').count() === 1 && await dlg.getByRole('checkbox', { name: 'Also remove this notice' }).isChecked(), 're-open dialog shows the live notice, with "also remove" ticked by default');
await dlg.getByRole('button', { name: 'Re-open applications' }).click(); await p.getByText('OPEN', { exact: true }).waitFor();
h = await landing(); ok(!h.includes('NOTICE-THREE') && h.includes('APPLY FOR THE COHORT'), 'after re-opening the old notice is gone and the apply button is back');
// re-open but KEEP the notice
await p.getByRole('button', { name: 'Close applications' }).click(); await p.getByRole('dialog').getByRole('button', { name: 'Close applications' }).click(); await p.getByText('CLOSED', { exact: true }).waitFor();
await p.fill('#notice', 'NOTICE-FOUR keep me'); await p.getByRole('button', { name: 'Save notice' }).click(); await p.getByText('Notice saved').waitFor();
await p.getByRole('button', { name: 'Re-open applications' }).click(); await p.getByRole('dialog').getByRole('checkbox', { name: 'Also remove this notice' }).uncheck(); await p.getByRole('dialog').getByRole('button', { name: 'Re-open applications' }).click(); await p.getByText('OPEN', { exact: true }).waitFor();
ok((await landing()).includes('NOTICE-FOUR'), 're-opening with the box unticked keeps the notice');
await settings({ notice: '' });
ok(native === 0, 'no native browser dialogs were shown');

// ---------- 3. an open student dashboard (and its card) update themselves
const u = Date.now().toString().slice(-8);
const app = { about: { fullName: 'Live Tester', phone: '020' + u.slice(0, 7), email: `live${u}@example.com`, location: 'Accra', ageBracket: '18-24', experience: 'none' },
  commitment: { why: 'I want to learn to build software for my community.', hopeToBuild: 'A web app for local shops.', canCommit: 'yes', practise: 'yes', seriousness: 'all', ackDiscipline: true },
  availability: { periods: ['evening'], format: 'remote' }, device: { phone: 'android', computer: 'win_laptop', internet: 'reliable', electricity: 'reliable', workspace: 'yes' }, finish: { certificate: 'yes', budget: 'yes', privacy: true } };
const { ref } = await (await fetch(BASE + '/api/apply', { method: 'POST', headers: J, body: JSON.stringify(app) })).json();
const st = await fetch(BASE + '/api/status', { method: 'POST', headers: J, body: JSON.stringify({ ref, email: app.about.email }) }); const sc = cookieOf(st)[0]; const S = { Cookie: sc };
const id = /\/admin\/applicants\/(\d+)/.exec(await (await fetch(BASE + '/admin?search=' + ref, { headers: A })).text())[1];
const patch = (b) => fetch(`${BASE}/api/admin/applicants/${id}`, { method: 'PATCH', headers: { ...J, ...A }, body: JSON.stringify(b) });
const pulse = async () => (await fetch(BASE + '/api/student/pulse', { headers: S })).json();
ok((await fetch(BASE + '/api/student/pulse')).status === 401, 'pulse requires a signed-in student');
const r0 = (await pulse()).rev; ok(r0 === (await pulse()).rev, 'pulse fingerprint is stable when nothing changes');
await patch({ seat: 'Q-1' }); const r1 = (await pulse()).rev; ok(r1 !== r0, 'pulse fingerprint changes when an admin assigns a seat');
await settings({ cohortName: 'FORGE30 — Cohort Two' }); ok((await pulse()).rev !== r1, 'pulse fingerprint changes when cohort info changes');

const sctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await sctx.addCookies([{ name: sc.split('=')[0], value: sc.split('=').slice(1).join('='), domain: 'localhost', path: '/' }]);
await sctx.addInitScript(() => { window.__PULSE_MS = 1000; });
const sp = await sctx.newPage(); await sp.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
await sp.evaluate(() => { window.__marker = 'not-reloaded'; });
ok(await sp.getByText('card unlocks here once your place is', { exact: false }).count() === 1 || await sp.getByText('unlocks here once your place is').count() === 1, 'student starts with the card locked (not confirmed yet)');
// admin confirms -> the card panel appears on its own
await patch({ status: 'confirmed', seat: 'B-7', groupLabel: 'Group A', sessionTime: '6:00-8:00 PM' });
await sp.getByText('Add your passport photo').waitFor({ timeout: 15000 });
ok(await sp.evaluate(() => window.__marker) === 'not-reloaded', 'confirming an applicant unlocks their card on the open page without a reload');
ok(await sp.getByText('B-7').count() >= 1 && await sp.getByText('Group A').count() >= 1 && await sp.getByText('6:00-8:00 PM').count() >= 1, 'assigned seat, group and class time appear automatically');
// give them a photo, then change things and watch the card images re-fetch
const html = await (await fetch(BASE + '/dashboard', { headers: S })).text(); const tok = decodeURIComponent(/cardToken\\?":\\?"([A-Za-z0-9_\-.%]+)/.exec(html)[1]);
const jpeg = await sharp({ create: { width: 600, height: 800, channels: 3, background: '#8aa9e6' } }).jpeg().toBuffer();
const fd = new FormData(); fd.append('token', tok); fd.append('photo', new File([jpeg], 'p.jpg', { type: 'image/jpeg' }));
ok((await fetch(BASE + '/api/card/photo', { method: 'POST', headers: { Origin: BASE }, body: fd })).status === 200, 'photo uploaded for the card test');
await sp.getByRole('img', { name: 'Student card front' }).waitFor({ timeout: 15000 });
const src1 = await sp.getByRole('img', { name: 'Student card front' }).getAttribute('src');
await patch({ seat: 'C-9' });
await sp.waitForFunction((old) => { const i = [...document.querySelectorAll('img')].find((x) => x.alt === 'Student card front'); return i && i.getAttribute('src') !== old; }, src1, { timeout: 15000 });
ok(true, 'the card images re-fetch themselves after an admin changes the seat');
const fresh = await (await fetch(`${BASE}/api/card/image?t=${encodeURIComponent(tok)}&side=front`)).arrayBuffer(); ok(fresh.byteLength > 5000, 'the re-fetched card renders');
// notices reach the open dashboard too
await settings({ notice: 'LIVE-NOTICE bring your laptop tomorrow' });
await sp.getByText('LIVE-NOTICE bring your laptop tomorrow').waitFor({ timeout: 15000 }); ok(await sp.evaluate(() => window.__marker) === 'not-reloaded', 'a new notice appears on the open dashboard without a reload');

// ---------- 4. decorated notices, popup, personal message, capacity, admin delete
await settings({ addAnnouncement: { title: 'STYLE-HEAD', text: 'Line **bold-bit** and [go](https://example.com)\n\n- one\n- two\n<script>alert(1)</script>', style: 'urgent', ctaLabel: 'Apply now', ctaUrl: '/apply', popup: true } });
let h4 = await landing();
ok(h4.includes('nt-urgent') && h4.includes('STYLE-HEAD') && h4.includes('<strong>bold-bit</strong>') && h4.includes('<li>one</li>'), 'announcement renders as a decorated card with headline, bold text and bullets');
ok(!h4.includes('<script>alert(1)</script>'), 'raw HTML in a notice is never rendered');
ok(h4.includes('Apply now') && h4.includes('NEW'), 'button and NEW badge show');
const bad = await settings({ addAnnouncement: { title: '', text: 'x', style: 'info', ctaLabel: 'Go', ctaUrl: 'javascript:alert(1)', popup: false } }); ok(bad.status === 400, 'unsafe button links are rejected');
const pctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const pp = await pctx.newPage(); await pp.goto(BASE + '/', { waitUntil: 'networkidle' });
await pp.getByRole('dialog').getByRole('button', { name: 'Got it' }).click(); await pp.reload({ waitUntil: 'networkidle' });
ok(await pp.getByRole('dialog').count() === 0 || !(await pp.getByRole('dialog').isVisible()), 'pop-up shows once, not again after dismissal');
await patch({ studentMessage: 'PERSONAL-MSG see me after class' });
await sp.getByText('PERSONAL-MSG see me after class').waitFor({ timeout: 15000 }); ok(true, 'a personal message appears on the student dashboard live');
await settings({ maxApplications: 1 });
h4 = await landing(); ok(!h4.includes('APPLY FOR THE COHORT'), 'capacity reached closes applications automatically');
const full = await fetch(BASE + '/api/apply', { method: 'POST', headers: J, body: JSON.stringify(app) }); ok(full.status === 403, 'apply API refuses when full');
await settings({ maxApplications: 0 });
const ed = await patch({ edit: { fullName: 'Live Renamed', email: app.about.email, phone: app.about.phone, location: 'Kumasi' } }); ok(ed.status === 200, 'admin can edit applicant details');
const del = await fetch(`${BASE}/api/admin/applicants/${id}`, { method: 'DELETE', headers: { ...J, ...A } }); ok(del.status === 200, 'admin can delete an applicant');
ok((await fetch(BASE + '/api/student/pulse', { headers: S })).status !== 200, 'deleted applicant no longer has a dashboard');
const stale = await fetch(BASE + '/status', { headers: S, redirect: 'manual' }); ok(stale.status === 200, 'a stale student cookie shows the sign-in form instead of looping');
const dd = await fetch(BASE + '/dashboard', { headers: S, redirect: 'manual' }); ok([302, 303, 307, 308].includes(dd.status) && /\/status/.test(dd.headers.get('location') || ''), 'dashboard sends a stale cookie to sign-in');
await settings({ notice: '', cohortName: 'FORGE30 — first cohort', clearAnnouncements: true });
await browser.close(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
