// Browser test: viewports, interactivity, full applicant journey on a phone. BASE=http://localhost:3000 node tests/browser.mjs
import { chromium, devices } from 'playwright-core';
import { readdirSync } from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = process.env.OUT || '/tmp/shots';
const exe = process.env.CHROME || (() => { const d = '/opt/pw-browsers'; const c = readdirSync(d).find((x) => x.startsWith('chromium-')); return `${d}/${c}/chrome-linux/chrome`; })();
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });

const VIEWS = {
  'android-small-360': { viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'android-large-412': { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'iphone-390': { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  'tablet-820': { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1, hasTouch: true },
  'desktop-1440': { viewport: { width: 1440, height: 900 } },
  'large-2200': { viewport: { width: 2200, height: 1200 } },
};

for (const [name, opts] of Object.entries(VIEWS)) {
  const ctx = await browser.newContext(opts); const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(ov <= 0, `${name}: no horizontal overflow (${ov}px)`);
  await page.screenshot({ path: `${OUT}/${name}-hero.png` });
  // scroll through to trigger reveals, then full page
  await page.evaluate(async () => { document.documentElement.style.scrollBehavior = 'auto'; for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); document.documentElement.style.scrollBehavior = ''; });
  await page.waitForTimeout(900);
  if (['android-small-360', 'desktop-1440'].includes(name)) await page.screenshot({ path: `${OUT}/${name}-full.png`, fullPage: true });
  const small = await page.evaluate(() => [...document.querySelectorAll('a.btn,button,.chip,input,select,textarea')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 32 && getComputedStyle(e).opacity !== '0' && e.type !== 'range' && e.type !== 'checkbox'; }).length);
  ok(small === 0, `${name}: no undersized tap targets (${small})`);

  const past = await page.evaluate(() => { const W = document.documentElement.clientWidth; return [...document.querySelectorAll('main *')].filter((el) => { if (el.closest('.chips')) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.right > W + 1 || r.left < -1); }).map((el) => `${el.closest('section')?.id || '-'}:${el.tagName.toLowerCase()}.${String(el.className).slice(0, 20)}`).slice(0, 4); });
  ok(past.length === 0, `${name}: no element extends past the screen edge (clipping can hide this) ${past.join(', ')}`);
  const hgt = await page.evaluate(() => document.documentElement.scrollHeight); if (name.startsWith('android-small')) ok(hgt < 3200, `${name}: the landing page is short (${hgt}px), not a long scroll`);
  ok(await page.evaluate(() => [...document.querySelectorAll('[data-anim]')].every((e) => e.classList.contains('in'))), `${name}: every scroll animation fired (nothing left hidden)`);
  // explorer: one card at a time
  const ex = page.locator('#explore'); const title = async () => (await ex.locator('.ex-title').innerText()).replace(/\s+/g, ' ');
  ok(/1\/6 WHAT IS IT/i.test(await title()), `${name}: explorer starts on the first card`);
  const nxt = () => page.locator('.ex-nav .btn-primary').click();
  await nxt(); ok(/2\/6 CHOOSE YOUR PATH/i.test(await title()), `${name}: Next moves to the path card`);
  await ex.locator('.ex-paths button').nth(0).click();
  ok(/Nothing developer-related is taught/i.test(await ex.locator('.ex-note').innerText()), `${name}: choosing computer skills says nothing developer-related is taught`);
  await ex.locator('.ex-levels button').nth(0).click();
  ok(/LCS · Low Computer Skills/i.test(await ex.locator('.ex-result').innerText()), `${name}: level shows the group (LCS · Low Computer Skills)`);
  ok((await ex.getByRole('link', { name: /APPLY WITH THESE CHOICES/ }).getAttribute('href')) === '/apply?goal=skills&level=none', `${name}: apply link carries the choices`);
  await ex.locator('.ex-paths button').nth(1).click(); ok(/Starting from zero is fine/i.test(await ex.locator('.ex-note').innerText()), `${name}: software development says starting from zero is fine`);
  await nxt(); ok(/3\/6 HOW IT WORKS/i.test(await title()), `${name}: card 3`);
  await ex.locator('.ex-method button').nth(3).click(); ok(/apply it to your own project/i.test(await ex.locator('#how .ex-say').innerText()), `${name}: method step explains itself`);
  await page.locator('.days button').nth(9).click(); ok(/20/.test(await ex.locator('#commitment [aria-live]').first().innerText()), `${name}: commitment counter shows 20 hours after day 10`);
  await nxt(); ok(/4\/6 YOUR PROJECT/i.test(await title()), `${name}: card 4`);
  await page.getByRole('tab', { name: /Solution/ }).click(); ok(/Decide how it would work/.test(await ex.locator('#project').innerText()), `${name}: project builder step`);
  await nxt(); ok(/5\/6 STRAIGHT ANSWERS/i.test(await title()), `${name}: card 5`);
  const q2 = ex.getByRole('button', { name: /Can I choose my class time/ }); await q2.click();
  ok((await q2.getAttribute('aria-expanded')) === 'true' && /assigned by SHARIF/.test(await ex.locator('#faq').innerText()), `${name}: FAQ accordion`);
  await nxt(); ok(/6\/6 JOIN/i.test(await title()) && await ex.locator('#int-name').isVisible(), `${name}: last card has Apply and the interest form`);
  await page.keyboard.press('ArrowLeft'); ok(/5\/6/.test(await title()), `${name}: keyboard arrow goes back`);
  await page.goto(BASE + '/#faq', { waitUntil: 'networkidle' }); ok(/5\/6 STRAIGHT ANSWERS/i.test(await title()), `${name}: a deep link (/#faq) opens that card`);
  if (opts.isMobile) {
    await page.locator('.burger').click(); await page.waitForTimeout(300);
    ok(await page.locator('.drawer.open a.btn').isVisible(), `${name}: mobile nav drawer opens with Apply`);
    const dtxt = await page.locator('.drawer.open').innerText(); ok(['Student dashboard', 'My project', 'FAQ', 'Final Project', 'Privacy notice'].every((t) => dtxt.includes(t)), `${name}: hamburger holds all links incl. Student dashboard`);
    const top = await page.locator('.drawer.open a.btn').evaluate((e) => e.getBoundingClientRect().top); ok(top < 140, `${name}: Apply sits at the top of the menu (${Math.round(top)}px)`);
    await page.screenshot({ path: `${OUT}/${name}-drawer.png` });
    await page.locator('.drawer.open a.l').nth(2).click(); await page.waitForTimeout(400);
    ok(await page.locator('.drawer.open').count() === 0, `${name}: drawer closes on navigate`);
  }
  ok(errs.length === 0, `${name}: no console/page errors ${errs.slice(0, 2).join(' | ')}`);
  await ctx.close();
}
await browser.close();
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
