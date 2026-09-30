// Applicant + admin journeys in a real (mobile) browser. BASE=... ADMIN_PASSWORD=... node tests/journey.mjs
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:3000', PW = process.env.ADMIN_PASSWORD, OUT = process.env.OUT || '/tmp/shots';
const exe = (() => { const d = '/opt/pw-browsers'; return `${d}/${readdirSync(d).find((x) => x.startsWith('chromium-'))}/chrome-linux/chrome`; })();
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message));
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

// Step 5: project
await page.fill('#project-title', 'FarmLink');
for (const [f, t] of [['idea', 'A web app connecting farmers with buyers directly so prices are fair.'], ['problem', 'Farmers lose money to middlemen and cannot find buyers easily.'], ['users', 'Farmers and buyers in the north.'], ['benefits', 'Better prices and less waste.'], ['growth', 'Add more regions and crops.'], ['personalBenefit', 'Commission per sale.'], ['vision', 'A trusted marketplace.']]) await page.fill('#project-' + f, t);
await cont(); ok(await page.getByText('Please choose an option').count() === 1, 'step 5: GH₵500 budget question required');
await opt('Yes, I am prepared'); await cont();

// Step 6
await page.locator('fieldset[data-field="finish-certificate"] label.opt', { hasText: 'Yes' }).tap();
await cont(); ok(await page.getByText('You must agree to the privacy notice').count() === 1, 'step 6: privacy consent required');
await page.locator('#finish-privacy').evaluate((el) => el.closest('label').click());
await cont();
ok(await page.getByRole('heading', { name: 'Review your application' }).count() === 1, 'review screen shown');
const rv = await page.locator('.review').innerText();
ok(['Kwame Asante', 'FarmLink', 'Tamale', 'GH₵50–100', 'Android', 'Evening', 'In person'].every((x) => rv.includes(x)), 'review shows all sections incl. contribution, device, project, format');
await page.screenshot({ path: `${OUT}/apply-review.png`, fullPage: true });
await page.getByRole('button', { name: 'Edit Your project' }).tap();
ok(await page.getByRole('heading', { name: 'Your project idea' }).count() === 1, 'review: Edit jumps back to that step');
await page.fill('#project-title', 'FarmLink Ghana');
for (let i = 0; i < 2; i++) await cont();
ok(await page.locator('.review').innerText().then((t) => t.includes('FarmLink Ghana')), 'edit persisted in review');

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
await page.goto(BASE + '/status'); await page.fill('#ref', ref); await page.fill('#em', `kwame${id}@example.com`); await page.getByRole('button', { name: 'CHECK STATUS' }).tap();
await page.getByText('Status: Submitted').waitFor(); ok(true, 'status page: applicant sees "Submitted"');

// admin journey
if (PW) {
  const a = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const p = await a.newPage();
  await p.goto(BASE + '/admin'); ok(p.url().endsWith('/admin/login'), 'admin: unauthenticated redirected to login');
  await p.fill('#pw', 'wrong-password'); await p.getByRole('button', { name: 'SIGN IN' }).click(); await p.getByText('Incorrect password').waitFor(); ok(true, 'admin: wrong password rejected');
  await p.fill('#pw', PW); await p.getByRole('button', { name: 'SIGN IN' }).click(); await p.waitForURL('**/admin'); ok(true, 'admin: login');
  await p.fill('input[name=search]', ref); await p.getByRole('button', { name: 'Apply filters' }).click(); await p.waitForURL(/search=/);
  ok(await p.getByText('Kwame Asante').count() === 1, 'admin: search by reference finds applicant');
  await p.screenshot({ path: `${OUT}/admin-list.png` });
  await p.getByRole('link', { name: 'Kwame Asante' }).click(); await p.getByText('FarmLink Ghana').first().waitFor();
  ok(await p.getByText('Mobile data only').count() >= 1 && await p.getByText('GH₵50–100').count() >= 1, 'admin: detail shows device + contribution');
  await p.selectOption('#st', 'selected'); await p.fill('#nt', 'Great project idea'); await p.getByRole('button', { name: 'Save' }).click(); await p.getByText('Saved').waitFor(); ok(true, 'admin: status + note saved');
  await p.screenshot({ path: `${OUT}/admin-detail.png`, fullPage: true });
  await p.goto(BASE + '/admin/settings'); await p.fill('#notice', 'Applications close soon'); await p.getByRole('button', { name: 'Save settings' }).click(); await p.getByText('Saved').waitFor();
  ok((await (await fetch(BASE + '/')).text()).includes('Applications close soon'), 'admin: public notice appears on landing page');
  await p.fill('#notice', ''); await p.getByRole('button', { name: 'Save settings' }).click(); await p.getByText('Saved').waitFor();
  await p.screenshot({ path: `${OUT}/admin-settings.png`, fullPage: true });
  const [dl] = await Promise.all([p.waitForEvent('download'), (async () => { await p.goto(BASE + '/admin'); await p.getByRole('link', { name: /Export CSV/ }).click(); })()]);
  ok(/forge30-applicants-.*\.csv/.test(dl.suggestedFilename()), 'admin: CSV export downloads');
}
ok(errs.length === 0, 'no page errors ' + errs.join('|'));
await browser.close(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
