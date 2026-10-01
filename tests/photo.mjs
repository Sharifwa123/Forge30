// Student photo preparation in a real phone browser, with real face detection.
// Needs face fixtures that are NOT committed (they are personal photos): PHOTO_FIXTURES=/dir with a-portrait.jpg, b-offcenter.jpg, c-tight.jpg
import { chromium } from 'playwright-core';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
const BASE = process.env.BASE || 'http://localhost:3000', PW = process.env.ADMIN_PASSWORD, FIX = process.env.PHOTO_FIXTURES || '/tmp/cal';
if (!['a-portrait.jpg', 'b-offcenter.jpg', 'c-tight.jpg'].every((f) => existsSync(`${FIX}/${f}`))) { console.log(`SKIP photo preparation test: fixtures not found in ${FIX} (set PHOTO_FIXTURES)`); process.exit(0); }
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const J = { 'Content-Type': 'application/json', Origin: BASE };
const cookieOf = (r) => (r.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]);
const d = '/opt/pw-browsers'; const exe = `${d}/${readdirSync(d).find((x) => x.startsWith('chromium-'))}/chrome-linux/chrome`;
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

async function confirmedStudent(tag) {
  const u = (Date.now() + tag).toString().slice(-8);
  const app = { about: { fullName: 'Photo Tester', phone: '024' + u.slice(0, 7), email: `photo${u}@example.com`, location: 'Accra', ageBracket: '18-24', experience: 'none' },
    commitment: { why: 'I want to learn to build software for my community.', hopeToBuild: 'A small web app for local shops.', canCommit: 'yes', practise: 'yes', seriousness: 'all', ackDiscipline: true },
    availability: { periods: ['evening'], format: 'remote' }, device: { phone: 'android', computer: 'win_laptop', internet: 'reliable', electricity: 'reliable', workspace: 'yes' }, finish: { certificate: 'yes', budget: 'yes', privacy: true } };
  const { ref } = await (await fetch(BASE + '/api/apply', { method: 'POST', headers: J, body: JSON.stringify(app) })).json();
  const st = await fetch(BASE + '/api/status', { method: 'POST', headers: J, body: JSON.stringify({ ref, email: app.about.email }) });
  const student = cookieOf(st)[0]; const al = await fetch(BASE + '/api/admin/login', { method: 'POST', headers: J, body: JSON.stringify({ password: PW }) }); const A = { Cookie: cookieOf(al).join('; ') };
  const id = /\/admin\/applicants\/(\d+)/.exec(await (await fetch(BASE + '/admin?search=' + ref, { headers: A })).text())[1];
  await fetch(`${BASE}/api/admin/applicants/${id}`, { method: 'PATCH', headers: { ...J, ...A }, body: JSON.stringify({ status: 'confirmed' }) });
  return { id, A, student: { name: student.split('=')[0], value: student.split('=').slice(1).join('=') } };
}
async function openDashboard(s) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addCookies([{ name: s.student.name, value: s.student.value, domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage(); page.on('dialog', (x) => { ok(false, 'a native browser dialog appeared'); x.dismiss(); });
  await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' }); return page;
}
const faceOf = async (dlg) => JSON.parse((await dlg.getAttribute('data-face')) || 'null');

// ---- 1. normal portrait: auto-centred, head ~72%, then a replacement with the change warning
const s1 = await confirmedStudent('1'); let page = await openDashboard(s1);
await page.locator('#photo-file').setInputFiles(`${FIX}/a-portrait.jpg`);
let dlg = page.locator('dialog.prep'); await dlg.waitFor({ timeout: 15000 });
ok(await dlg.getByRole('heading', { name: 'Prepare your passport photo' }).isVisible(), 'photo dialog opens (branded, not a browser prompt)');
await page.locator('dialog.prep[data-status="found"]').waitFor({ timeout: 90000 });
let f = await faceOf(dlg); ok(f && Math.abs(f.cx - 0.5) < 0.06, `portrait: face is centred horizontally (${f?.cx})`);
ok(f && f.head > 0.62 && f.head < 0.84, `portrait: head fills a passport-like share of the frame (${f?.head})`);
ok(f && f.crown > 0.04 && f.crown < 0.16, `portrait: small headroom above the crown (${f?.crown})`);
await page.screenshot({ path: '/tmp/shots/photo-dialog.png' });
ok(await dlg.getByText('Looks good').count() === 1, 'portrait: tells the student it looks good');
await dlg.getByRole('button', { name: 'Use this photo' }).tap(); await dlg.waitFor({ state: 'detached' });
await page.getByRole('img', { name: 'Student card front' }).waitFor({ timeout: 20000 }); ok(true, 'card appears after the first photo');
let r = await fetch(`${BASE}/api/admin/photo/${s1.id}`, { headers: s1.A }); let m = await sharp(Buffer.from(await r.arrayBuffer())).metadata();
ok(m.width === 413 && m.height === 531, `stored photo is passport size (${m.width}×${m.height})`);
// replacement: small, off-centre person gets re-centred and the one-change warning is shown
await page.locator('#photo-file').setInputFiles(`${FIX}/b-offcenter.jpg`);
await page.locator('dialog.prep[data-status="found"]').waitFor({ timeout: 90000 });
dlg = page.locator('dialog.prep'); f = await faceOf(dlg);
ok(f && Math.abs(f.cx - 0.5) < 0.06, `off-centre photo: face re-centred (${f?.cx})`);
ok(await dlg.getByText('only once').count() === 1, 'replacement: dialog warns the photo can be changed only once');
// the student can fine-tune: dragging the photo moves the face away from centre
const box = await page.locator('.prep-frame').boundingBox(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 5 }); await page.mouse.up();
const moved = await faceOf(dlg); ok(moved && Math.abs(moved.cx - f.cx) > 0.05, `dragging adjusts the framing (${f.cx} -> ${moved?.cx})`);
await dlg.getByRole('button', { name: 'Reset to automatic' }).click(); const back = await faceOf(dlg); ok(back && Math.abs(back.cx - 0.5) < 0.06, 'reset returns to the automatic centring');
await dlg.getByRole('button', { name: 'Choose another' }).tap(); await dlg.waitFor({ state: 'detached' });
r = await fetch(`${BASE}/api/admin/photo/${s1.id}`, { headers: s1.A }); ok(r.status === 200, 'cancelling leaves the existing photo untouched');

// ---- 2. no face found (over-tight crop): clear message, manual positioning still possible
const s2 = await confirmedStudent('2'); page = await openDashboard(s2);
await page.locator('#photo-file').setInputFiles(`${FIX}/c-tight.jpg`);
await page.locator('dialog.prep[data-status="none"]').waitFor({ timeout: 90000 }); dlg = page.locator('dialog.prep');
ok(await dlg.getByText('could not find a face').count() === 1, 'no face: tells the student plainly and offers manual framing');
ok(await dlg.getByRole('button', { name: 'Use this photo' }).isEnabled(), 'no face: student can still position it manually and continue');

// ---- 3. unreadable file
writeFileSync('/tmp/not-an-image.jpg', 'this is not an image'); page = await openDashboard(await confirmedStudent('3'));
await page.locator('#photo-file').setInputFiles('/tmp/not-an-image.jpg');
await page.locator('dialog.prep[data-status="unreadable"]').waitFor({ timeout: 15000 }); dlg = page.locator('dialog.prep');
ok(await dlg.getByText('could not read that file').count() === 1 && await dlg.getByRole('button', { name: 'Use this photo' }).isDisabled(), 'unreadable file: clear message, cannot be submitted');

await browser.close(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
