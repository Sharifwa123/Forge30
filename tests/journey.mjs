// Applicant + admin journeys in a real (mobile) browser. BASE=... ADMIN_PASSWORD=... node tests/journey.mjs
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:3000', PW = process.env.ADMIN_PASSWORD, OUT = process.env.OUT || '/tmp/shots';
const exe = (() => { const d = '/opt/pw-browsers'; return `${d}/${readdirSync(d).find((x) => x.startsWith('chromium-'))}/chrome-linux/chrome`; })();
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message));
let nativeDialogs = 0; const noNative = (pg) => pg.on('dialog', (d) => { nativeDialogs++; d.dismiss(); }); noNative(page);
const id = Date.now().toString().slice(-7);
const cont = () => page.getByRole('button', { name: /CONTINUE|REVIEW MY APPLICATION/ }).tap();
const opt = (t) => page.locator('label.opt', { hasText: t }).first().tap();

await page.goto(BASE + '/apply', { waitUntil: 'networkidle' });
ok(await page.getByText('READ THIS BEFORE APPLYING', { exact: false }).count() > 0 || await page.getByText('Read this before applying').count() > 0, 'gate: "read this before applying" shown first');
ok(await page.getByText('If you are only curious about coding').count() === 1, 'gate: casual-applicant warning shown');
await page.screenshot({ path: `${OUT}/apply-gate.png` });
await page.getByRole('button', { name: /READY TO APPLY/ }).tap();

// Step 1: validation
await cont();
ok(await page.locator('.error').count() >= 4, 'step 1: empty submit shows inline errors');
ok(await page.evaluate(() => document.activeElement?.id) === 'about-fullName', 'step 1: focus moves to first invalid field');
await page.screenshot({ path: `${OUT}/apply-step1-errors.png` });
await page.fill('#about-fullName', 'Kwame Asante'); await page.fill('#about-preferredName', 'Kwame');
await page.fill('#about-phone', '12'); await page.fill('#about-email', 'bad'); await page.locator('#about-email').blur();
ok(await page.getByText('Enter a valid email address').count() === 1, 'step 1: invalid email message on blur');
await page.fill('#about-phone', '024' + id); await page.fill('#about-email', `kwame${id}@example.com`);
await page.fill('#about-location', 'Tamale, Northern'); await page.selectOption('#about-ageBracket', '18-24'); await opt('None — I have never');
ok(await page.getByText('Starting from zero is fine').count() === 1, 'step 1: zero-experience reassurance shown (conditional)');
await cont();

// Step 2: commitment gate
ok(await page.getByRole('heading', { name: 'Your commitment' }).count() === 1, 'reached step 2');
await page.fill('#commitment-why', 'I want to learn to build real software and solve problems in my community.');
await page.fill('#commitment-hopeToBuild', 'A useful web application for farmers in my area.');
await opt('No, I cannot'); 
ok(await page.getByText('may not be the right fit').count() === 1 && await page.getByRole('button', { name: /CONTINUE/ }).isDisabled(), 'step 2: answering "No" blocks progress with explanation');
await opt('Yes, I understand and can commit'); await opt('Yes').then(() => {}); 
await page.locator('fieldset[data-field="commitment-practise"] label.opt').first().tap();
await page.locator('fieldset[data-field="commitment-seriousness"] label.opt').first().tap();
await cont();
ok(await page.getByText('You must accept these conditions').count() === 1, 'step 2: discipline acknowledgement required');
await page.locator('#commitment-ackDiscipline').evaluate((el) => el.closest('label').click());
await cont();

// Step 3: conditional contribution
ok(await page.getByText('Your class time is assigned by SHARIF TECHNOLOGIES').count() >= 1, 'step 3: class time assigned notice');
await page.locator('fieldset[data-field="availability-periods"] label.opt', { hasText: 'Evening' }).tap();
await page.locator('fieldset[data-field="availability-format"] label.opt', { hasText: 'Remote' }).tap();
ok(await page.locator('[data-field="availability-contribPref"]').count() === 0 && await page.getByText('If remote').count() === 1, 'step 3: Remote hides contribution, shows remote considerations');
await page.locator('fieldset[data-field="availability-format"] label.opt', { hasText: 'In person' }).tap();
ok(await page.locator('[data-field="availability-contribPref"]').count() === 1 && await page.getByText('not a course fee').count() >= 1, 'step 3: In person shows contribution questions');
await cont(); ok(await page.locator('.error').count() === 2, 'step 3: contribution answers required for in person');
await page.locator('fieldset[data-field="availability-contribPref"] label.opt', { hasText: 'flexible' }).tap();
await page.locator('fieldset[data-field="availability-contribRange"] label.opt', { hasText: 'GH₵50–100' }).tap();
await page.screenshot({ path: `${OUT}/apply-step3.png`, fullPage: true });
await cont();

// Step 4: devices; refresh persistence
await page.locator('fieldset[data-field="device-phone"] label.opt', { hasText: 'Android' }).tap();
await page.locator('fieldset[data-field="device-computer"] label.opt', { hasText: 'do not currently have' }).tap();
ok(await page.getByText('shared computer', { exact: false }).count() >= 1, 'step 4: no-computer explains and asks about shared access');
await page.reload({ waitUntil: 'networkidle' });
ok(await page.getByRole('heading', { name: 'Device & access' }).count() === 1 && await page.inputValue('#about-fullName').catch(() => 'x') !== undefined, 'refresh mid-application restores step from saved draft');
ok(await page.locator('fieldset[data-field="device-computer"] input:checked').count() === 1, 'refresh restores answers');
await cont(); ok(await page.locator('.error').count() >= 4, 'step 4: required device answers validated');
await page.locator('fieldset[data-field="device-sharedComputer"] label.opt').first().tap();
await page.locator('fieldset[data-field="device-internet"] label.opt', { hasText: 'Mobile data' }).tap();
await page.locator('fieldset[data-field="device-electricity"] label.opt').first().tap();
await page.locator('fieldset[data-field="device-workspace"] label.opt').first().tap();
await cont();

// Step 5 (finish): budget, certificate, consent
await cont(); ok(await page.locator('.error').count() === 3, 'finish: budget, certificate and consent all required');
await opt('Yes, I am prepared'); await page.locator('fieldset[data-field="finish-certificate"] label.opt', { hasText: 'Yes' }).tap();
await cont(); ok(await page.getByText('You must agree to the privacy notice').count() === 1, 'finish: privacy consent required');
await page.locator('#finish-privacy').evaluate((el) => el.closest('label').click());
await cont();
ok(await page.getByRole('heading', { name: 'Review your application' }).count() === 1, 'review screen shown');
const rv = await page.locator('.review').innerText();
ok(['Kwame Asante', 'GH₵500 project budget', 'Tamale', 'GH₵50–100', 'Android', 'Evening', 'In person'].every((x) => rv.includes(x)), 'review shows all sections incl. contribution, device, budget, format');
await page.screenshot({ path: `${OUT}/apply-review.png`, fullPage: true });
ok(!(await page.locator('.review').innerText()).includes('Working name'), 'application no longer asks for the project idea (moved to dashboard)');
await page.getByRole('button', { name: 'Edit Your information' }).tap();
ok(await page.getByRole('heading', { name: 'About you' }).count() === 1, 'review: Edit jumps back to that step');
await page.fill('#about-preferredName', 'Kwamena');
for (let i = 0; i < 5; i++) await cont();
ok(await page.locator('.review').innerText().then((t) => t.includes('Kwamena')), 'edit persisted in review');

// network interruption
await ctx.setOffline(true);
await page.getByRole('button', { name: 'SUBMIT APPLICATION' }).tap(); await page.waitForTimeout(800);
ok(await page.getByText('could not reach the server').count() === 1, 'offline submit: clear error, draft kept');
await ctx.setOffline(false);
await page.getByRole('button', { name: 'SUBMIT APPLICATION' }).tap();
await page.getByRole('heading', { name: 'APPLICATION RECEIVED' }).waitFor({ timeout: 10000 });
const done = await page.locator('.form-card').innerText();
ok(/F30-[0-9A-F]{8}/.test(done) && done.includes('does not guarantee selection') && !/enrolled\./i.test(done.replace('not enrolled', '')), 'confirmation: ref code, no guarantee, not "enrolled"');
ok(await page.evaluate(() => localStorage.getItem('forge30-draft-v1')) === null, 'draft cleared after submission');
await page.screenshot({ path: `${OUT}/apply-done.png` });
const ref = /F30-[0-9A-F]{8}/.exec(done)[0];

// duplicate from a fresh browser state
await page.goto(BASE + '/apply', { waitUntil: 'networkidle' });
ok(await page.getByText('Read this before applying').count() === 1, 'fresh visit starts at the gate again');

// status page
await page.goto(BASE + '/status'); await page.fill('#ref', ref); await page.fill('#em', `kwame${id}@example.com`); await page.getByRole('button', { name: 'OPEN MY DASHBOARD' }).tap();
await page.waitForURL('**/dashboard'); await page.getByRole('heading', { name: /Welcome, Kwame/ }).waitFor(); ok(true, 'dashboard: student signed in and sees welcome');
ok(await page.getByText('Submitted', { exact: true }).count() >= 1 && await page.getByText('unlocks here once your place is').count() === 1, 'dashboard: status shown, card locked until confirmed');
await page.fill('#c-whatsapp', '0551234567'); await page.locator('fieldset[data-field="c-method"] label.opt', { hasText: 'WhatsApp' }).tap(); await page.locator('fieldset[data-field="c-time"] label.opt', { hasText: 'Evening' }).tap(); await page.getByRole('button', { name: 'SAVE CONTACT DETAILS' }).tap(); await page.getByText('Saved. SHARIF TECHNOLOGIES').waitFor(); ok(true, 'dashboard: contact details saved');
await page.screenshot({ path: `${OUT}/dashboard-mobile.png`, fullPage: true });
await page.reload(); ok(await page.getByRole('heading', { name: /Welcome, Kwame/ }).count() === 1, 'dashboard: still signed in after reload (remembered)');
// project workspace
ok(await page.getByRole('link', { name: /START MY PROJECT/ }).count() === 1, 'dashboard: project card invites student to start');
await page.getByRole('link', { name: /START MY PROJECT/ }).tap(); await page.waitForURL('**/dashboard/project');
await page.fill('#ptitle', 'FarmLink'); await page.locator('#ptitle').blur(); await page.getByText('✓ Saved').first().waitFor();
await page.fill('#t-problem', 'Farmers in the north lose money to middlemen and cannot reach buyers directly.'); await page.locator('#t-problem').blur(); await page.locator('#sec-problem').getByText('✓ Saved').waitFor({ timeout: 8000 });
await page.locator('#sec-problem label.opt').tap(); await page.locator('#sec-problem').getByText('✓ Saved').waitFor({ timeout: 8000 }); await page.waitForTimeout(300);
await page.reload(); await page.getByRole('button', { name: /The problem/ }).waitFor();
ok((await page.locator('#ptitle').inputValue()) === 'FarmLink', 'project: title saved and restored after reload');
await page.getByRole('button', { name: /The problem/ }).tap(); ok((await page.locator('#t-problem').inputValue()).includes('middlemen'), 'project: section autosaved and restored after reload');
ok(await page.getByText('1 of 10 sections ready').count() === 1, 'project: ready progress counts');
await page.screenshot({ path: `${OUT}/project-mobile.png`, fullPage: true });
await page.getByRole('tab', { name: /Progress journal/ }).tap(); await page.fill('#jt', 'Today I wrote the problem statement.'); await page.getByRole('button', { name: 'ADD ENTRY' }).tap(); await page.getByText('Today I wrote the problem statement.').waitFor(); ok(true, 'project: journal entry added');
const dlg = page.getByRole('dialog');
await page.getByRole('button', { name: /Delete entry from/ }).tap(); await dlg.getByRole('heading', { name: 'Delete this journal entry?' }).waitFor();
await dlg.getByRole('button', { name: 'Cancel' }).tap(); await dlg.waitFor({ state: 'detached' }); ok(await page.getByText('Today I wrote the problem statement.').count() === 1, 'dialog: Cancel keeps the journal entry');
await page.getByRole('button', { name: /Delete entry from/ }).tap(); await dlg.getByRole('button', { name: 'Delete entry' }).tap(); await page.getByText('Today I wrote the problem statement.').waitFor({ state: 'detached' }); ok(true, 'dialog: branded confirm deletes the journal entry');
await page.getByRole('tab', { name: 'Proposal' }).tap(); ok((await page.locator('.proposal').innerText()).includes('FarmLink') && (await page.locator('.proposal').innerText()).includes('middlemen'), 'project: proposal compiled from sections');
await page.screenshot({ path: `${OUT}/project-proposal.png`, fullPage: true });

// admin journey
if (PW) {
  const a = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const p = await a.newPage();
  await p.goto(BASE + '/admin'); ok(p.url().endsWith('/admin/login'), 'admin: unauthenticated redirected to login');
  await p.fill('#pw', 'wrong-password'); await p.getByRole('button', { name: 'SIGN IN' }).click(); await p.getByText('Incorrect password').waitFor(); ok(true, 'admin: wrong password rejected');
  await p.fill('#pw', PW); await p.getByRole('button', { name: 'SIGN IN' }).click(); await p.waitForURL('**/admin'); ok(true, 'admin: login');
  await p.fill('input[name=search]', ref); await p.getByRole('button', { name: 'Apply filters' }).click(); await p.waitForURL(/search=/);
  ok(await p.getByText('Kwame Asante').count() === 1, 'admin: search by reference finds applicant');
  await p.screenshot({ path: `${OUT}/admin-list.png` });
  await p.getByRole('link', { name: 'Kwame Asante' }).click(); await p.getByText('FarmLink').first().waitFor();
  ok(await p.getByText('Mobile data only').count() >= 1 && await p.getByText('GH₵50–100').count() >= 1, 'admin: detail shows device + contribution');
  ok(await p.getByText('Farmers in the north lose money').count() >= 1, 'admin: sees the student’s project workspace');
  await p.selectOption('#st', 'selected'); await p.fill('#nt', 'Great project idea'); await p.getByRole('button', { name: 'Save' }).click(); await p.getByText('Saved').waitFor(); ok(true, 'admin: status + note saved');
  await p.screenshot({ path: `${OUT}/admin-detail.png`, fullPage: true });
  await p.goto(BASE + '/admin/settings'); noNative(p);
  await p.getByRole('button', { name: 'Close applications' }).click(); const ad = p.getByRole('dialog'); await ad.getByRole('heading', { name: 'Close applications?' }).waitFor();
  await ad.getByRole('button', { name: 'Cancel' }).click(); await ad.waitFor({ state: 'detached' }); ok(await p.getByText('OPEN', { exact: true }).count() >= 1, 'dialog: Cancel leaves applications open');
  await p.getByRole('button', { name: 'Close applications' }).click(); await ad.getByRole('button', { name: 'Close applications' }).click(); await p.getByText('CLOSED', { exact: true }).waitFor({ timeout: 8000 }); ok(true, 'dialog: branded confirm closes applications');
  await p.getByRole('button', { name: 'Re-open applications' }).click(); await p.getByText('OPEN', { exact: true }).waitFor({ timeout: 8000 }); ok(true, 'applications re-opened');
  await p.fill('#notice', 'Applications close soon'); await p.getByRole('button', { name: 'Save settings' }).click(); await p.getByText('Saved').waitFor();
  ok((await (await fetch(BASE + '/')).text()).includes('Applications close soon'), 'admin: public notice appears on landing page');
  await p.fill('#notice', ''); await p.getByRole('button', { name: 'Save settings' }).click(); await p.getByText('Saved').waitFor();
  await p.screenshot({ path: `${OUT}/admin-settings.png`, fullPage: true });
  const [dl] = await Promise.all([p.waitForEvent('download'), (async () => { await p.goto(BASE + '/admin'); await p.getByRole('link', { name: /Export CSV/ }).click(); })()]);
  ok(/forge30-applicants-.*\.csv/.test(dl.suggestedFilename()), 'admin: CSV export downloads');
}
ok(nativeDialogs === 0, `no native browser dialogs were shown (${nativeDialogs})`);
ok(errs.length === 0, 'no page errors ' + errs.join('|'));
await browser.close(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
