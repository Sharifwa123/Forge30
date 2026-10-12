// Choices made in the landing explorer carry into the application form.
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:3000';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const d = '/opt/pw-browsers'; const exe = `${d}/${readdirSync(d).find((x) => x.startsWith('chromium-'))}/chrome-linux/chrome`;
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
// explorer -> apply with choices
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await p.locator('.ex-nav .btn-primary').click(); await p.locator('.ex-paths button').nth(0).click(); await p.locator('.ex-levels button').nth(0).click();
await p.getByRole('link', { name: /APPLY WITH THESE CHOICES/ }).click(); await p.waitForURL('**/apply?goal=skills&level=none');
await p.getByRole('button', { name: /READY TO APPLY/ }).tap();
const checked = (id) => p.locator(`fieldset[data-field="${id}"] input:checked`).evaluate((e) => e.value).catch(() => '');
ok(await checked('about-goal') === 'skills' && await checked('about-experience') === 'none', 'the application opens with the goal and level chosen in the explorer already filled in');
// the Continue button stays in view without scrolling to the bottom of a long step
const box = await p.getByRole('button', { name: /CONTINUE/ }).first().boundingBox();
ok(!!box && box.y + box.height <= 844, 'the Continue button is visible without scrolling');
// swipe left on the explorer moves to the next card
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await p.evaluate(() => { const el = document.getElementById('explore'); const mk = (t, x, y) => new TouchEvent(t, { bubbles: true, cancelable: true, touches: t === 'touchend' ? [] : [new Touch({ identifier: 1, target: el, clientX: x, clientY: y })], changedTouches: [new Touch({ identifier: 1, target: el, clientX: x, clientY: y })] }); el.dispatchEvent(mk('touchstart', 300, 500)); el.dispatchEvent(mk('touchend', 120, 505)); });
await p.waitForTimeout(400);
ok(/2\/6/.test(await p.locator('.ex-title').innerText()), 'swiping left moves to the next card');
await browser.close(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
