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

  const hgt = await page.evaluate(() => document.documentElement.scrollHeight); if (name.startsWith('android-small')) ok(hgt < 9500, `${name}: page length is reasonable (${hgt}px)`);
  ok(await page.evaluate(() => [...document.querySelectorAll('[data-anim]')].every((e) => e.classList.contains('in'))), `${name}: every scroll animation fired (nothing left hidden)`);
  // interactions
  await page.locator('#journey .chip').nth(4).click();
  ok((await page.locator('#stage-panel h3').innerText()) === 'Backend', `${name}: journey stage click reveals Backend`);
  await page.locator('#journey .chip').nth(4).focus(); await page.keyboard.press('ArrowRight');
  ok((await page.locator('#stage-panel h3').innerText()) === 'Data', `${name}: journey keyboard arrow`);
  await page.locator('.days button').nth(9).scrollIntoViewIfNeeded(); await page.locator('.days button').nth(9).click();
  ok(/20/.test(await page.locator('#commitment [aria-live]').first().innerText()), `${name}: commitment counter shows 20 hours after day 10`);
  await page.getByRole('tab', { name: 'What you need' }).scrollIntoViewIfNeeded(); await page.getByRole('tab', { name: 'What you need' }).click();
  await page.getByRole('button', { name: 'macOS' }).click();
  ok(/Mac laptops/.test(await page.locator('#delivery').innerText()), `${name}: device selector macOS`);
  await page.getByRole('button', { name: 'No computer' }).click();
  ok(/shared computer/.test(await page.locator('#delivery').innerText()), `${name}: device selector no-computer message`);
  await page.getByRole('tab', { name: /Solution/ }).scrollIntoViewIfNeeded(); await page.getByRole('tab', { name: /Solution/ }).click();
  ok(/Decide how it would work/.test(await page.locator('#project').innerText()), `${name}: project builder step`);
  await page.locator('#day30 .present button').first().scrollIntoViewIfNeeded(); await page.locator('#day30 .present button').first().click();
  ok(/1 of 9/.test(await page.locator('#day30').innerText()), `${name}: day-30 checklist`);
  const q2 = page.locator('#faq button').nth(3); await q2.scrollIntoViewIfNeeded(); await q2.click();
  ok((await q2.getAttribute('aria-expanded')) === 'true' && /assigned by SHARIF/.test(await page.locator('#faq').innerText()), `${name}: FAQ accordion`);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.locator('#hero input[type=range]').fill('30');
  ok(/60 of 60/.test(await page.locator('#hero .tracker').innerText()), `${name}: hero day tracker`);
  if (opts.isMobile) {
    await page.evaluate(() => window.scrollTo({ top: 1400, behavior: 'instant' })); await page.waitForTimeout(800);
    ok(await page.locator('.sticky.show').count() === 1, `${name}: sticky mobile CTA appears after hero`);
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
