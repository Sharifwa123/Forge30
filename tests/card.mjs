// Student card / dashboard lifecycle. BASE=... ADMIN_PASSWORD=... node tests/card.mjs
import sharp from 'sharp';
import jsQR from 'jsqr';
import { writeFileSync } from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:3000', PW = process.env.ADMIN_PASSWORD, OUT = process.env.OUT || '/tmp/shots';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const J = { 'Content-Type': 'application/json', Origin: BASE };
const uniq = Date.now().toString().slice(-7);
const app = { about: { fullName: 'Akosua Boateng-Owusu', preferredName: 'Akosua', phone: '020' + uniq, email: `akosua${uniq}@example.com`, location: 'Wenchi, Bono', ageBracket: '18-24', experience: 'none' },
  commitment: { why: 'I want to learn to build software that helps people in my town.', hopeToBuild: 'A booking app for local clinics and salons.', canCommit: 'yes', practise: 'yes', seriousness: 'all', ackDiscipline: true },
  availability: { periods: ['evening'], format: 'in_person', contribPref: 'flexible', contribRange: '50-100' },
  device: { phone: 'android', computer: 'win_laptop', internet: 'reliable', electricity: 'reliable', workspace: 'yes' },
  finish: { certificate: 'yes', budget: 'yes', privacy: true } };
const strip = (h) => h.replace(/<!--.*?-->/g, '');
const cookieOf = (r) => (r.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');

let r = await fetch(BASE + '/api/apply', { method: 'POST', headers: J, body: JSON.stringify(app) }); let j = await r.json();
const ref = j.ref; ok(r.status === 200, 'application submitted ' + ref);

// student sign-in
r = await fetch(BASE + '/api/status', { method: 'POST', headers: J, body: JSON.stringify({ ref, email: app.about.email }) });
const S = { Cookie: cookieOf(r) }; ok(r.status === 200 && S.Cookie.startsWith('f30_student='), 'status lookup signs the student in (cookie)');
ok((await r.json()).card === undefined, 'status API no longer leaks card data');
let d = strip(await (await fetch(BASE + '/dashboard', { headers: S })).text());
ok(d.includes('Welcome, Akosua') && d.includes('Submitted') && d.includes('unlocks here once your place is'), 'dashboard: greeting, status, card locked until confirmed');
ok(!d.includes('Strong') , 'dashboard renders');
r = await fetch(BASE + '/dashboard', { redirect: 'manual' }); ok(r.status === 307 && r.headers.get('location').includes('/status'), 'dashboard without session redirects to sign-in');
r = await fetch(BASE + '/dashboard', { headers: { Cookie: 'f30_student=' + ref + '.9999999999.forged' }, redirect: 'manual' }); ok(r.status === 307, 'forged student cookie rejected');
r = await fetch(BASE + '/status', { headers: S, redirect: 'manual' }); ok(r.status === 307 && r.headers.get('location').includes('/dashboard'), 'signed-in student visiting /status goes to dashboard');

// contact details
r = await fetch(BASE + '/api/student/contact', { method: 'POST', headers: J, body: JSON.stringify({}) }); ok(r.status === 401, 'contact update requires student session');
r = await fetch(BASE + '/api/student/contact', { method: 'POST', headers: { ...J, ...S }, body: JSON.stringify({ whatsapp: '12', preferredMethod: 'whatsapp', bestTime: 'evening' }) }); j = await r.json(); ok(r.status === 422 && j.fields.whatsapp, 'invalid WhatsApp rejected');
r = await fetch(BASE + '/api/student/contact', { method: 'POST', headers: { ...J, ...S }, body: JSON.stringify({ preferredMethod: 'call', bestTime: 'evening', emergencyName: 'Yaw' }) }); ok(r.status === 422, 'emergency contact needs both name and number');
r = await fetch(BASE + '/api/student/contact', { method: 'POST', headers: { ...S, 'Content-Type': 'application/json' }, body: JSON.stringify({}) }); ok(r.status === 403, 'contact update blocks missing Origin (CSRF)');
r = await fetch(BASE + '/api/student/contact', { method: 'POST', headers: { ...J, ...S }, body: JSON.stringify({ whatsapp: '0551234567', preferredMethod: 'whatsapp', bestTime: 'evening', emergencyName: 'Yaw Boateng', emergencyPhone: '0207654321' }) }).catch(() => null);
ok(r.status === 200, 'contact details saved');

// card is locked while not confirmed
const token = async () => { const t = await (await fetch(BASE + '/dashboard', { headers: S })).text(); return /cardToken\\?":\\?"([A-Za-z0-9_\-.]+)/.exec(t)?.[1]; };
ok((await token()) === undefined, 'no card token issued while not confirmed');

// admin confirms
ok(!!PW, 'ADMIN_PASSWORD provided'); r = await fetch(BASE + '/api/admin/login', { method: 'POST', headers: J, body: JSON.stringify({ password: PW }) }); const A = { Cookie: cookieOf(r) };
const page = await (await fetch(BASE + '/admin?search=' + ref, { headers: A })).text(); const id = /\/admin\/applicants\/(\d+)/.exec(page)[1];
r = await fetch(`${BASE}/api/admin/applicants/${id}`, { method: 'PATCH', headers: { ...J, ...A }, body: JSON.stringify({ status: 'confirmed', seat: 'B-14', groupLabel: 'Group A', sessionTime: '6:00–8:00 PM daily' }) }); ok(r.status === 200, 'admin confirms applicant with seat/group/time');
const detail = await (await fetch(`${BASE}/admin/applicants/${id}`, { headers: A })).text();
const sid = /F30-\d\d-\d{4}/.exec(detail)?.[0], serial = /[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}/.exec(detail)?.[0];
ok(!!sid && !!serial, `student ID ${sid} and serial ${serial} issued on confirmation`);
ok(detail.includes('0551234567') && detail.includes('Yaw Boateng'), 'admin sees applicant contact details');
await fetch(`${BASE}/api/admin/applicants/${id}`, { method: 'PATCH', headers: { ...J, ...A }, body: JSON.stringify({ status: 'confirmed' }) });
const detail2 = await (await fetch(`${BASE}/admin/applicants/${id}`, { headers: A })).text(); ok(detail2.includes(sid), 'IDs are stable on repeated confirmation');

d = strip(await (await fetch(BASE + '/dashboard', { headers: S })).text());
ok(d.includes('Add your passport photo') && d.includes('B-14') && d.includes('Group A') && d.includes('6:00–8:00 PM daily'), 'dashboard: card unlocked, seat/group/time shown');
const T = await token(); ok(!!T, 'card token present when confirmed');
const dsrc = await (await fetch(BASE + '/dashboard', { headers: S })).text(); const fileInputs = dsrc.match(/<input[^>]*type="file"[^>]*>/g) || [];
ok(fileInputs.length === 2 && fileInputs.filter((x) => /capture/.test(x)).length === 1, 'photo: one camera input (capture) AND one gallery/file input (no capture)');
const img = (side = 'front', t = T) => fetch(`${BASE}/api/card/image?t=${t}&side=${side}`);
ok((await img()).status === 409, 'card image refused until photo uploaded (409)');

// photo upload validation
const photoTest = async (buf, name = 'p.jpg', type = 'image/jpeg', t = decodeURIComponent(T)) => { const fd = new FormData(); fd.append('token', t); fd.append('photo', new File([buf], name, { type })); return fetch(BASE + '/api/card/photo', { method: 'POST', headers: { Origin: BASE }, body: fd }); };
ok((await photoTest(Buffer.from('not an image at all'))).status === 422, 'non-image rejected');
ok((await photoTest(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 'x.svg', 'image/svg+xml')).status === 422, 'SVG rejected');
ok((await photoTest(await sharp({ create: { width: 100, height: 100, channels: 3, background: '#888' } }).jpeg().toBuffer())).status === 422, 'tiny photo rejected');
ok((await photoTest(Buffer.alloc(10), 'p.jpg', 'image/jpeg', 'bad.token')).status === 401, 'tampered token rejected');
// a portrait-like test image with EXIF we expect stripped
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe0ff"/><stop offset="1" stop-color="#8aa9e6"/></linearGradient></defs><rect width="900" height="1200" fill="url(#g)"/><circle cx="450" cy="470" r="190" fill="#8d5a3b"/><rect x="190" y="700" width="520" height="500" rx="200" fill="#1e5ecf"/></svg>`;
const jpeg = await sharp(Buffer.from(svg)).jpeg().withMetadata({ exif: { IFD0: { Copyright: 'SECRET-GPS' } } }).toBuffer();
r = await photoTest(jpeg); ok(r.status === 200, 'valid photo accepted');
ok((await photoTest(jpeg, 'p.jpg', 'image/jpeg', 'x')).status === 401, 'bad token on upload -> 401');

// card rendering
for (const side of ['front', 'back']) {
  r = await img(side); const b = Buffer.from(await r.arrayBuffer()); const m = await sharp(b).metadata().catch(() => ({}));
  ok(r.status === 200 && r.headers.get('content-type') === 'image/png' && m.width === 1012 && m.height === 638, `card ${side}: 1012×638 PNG (CR80 @300dpi)`);
  writeFileSync(`${OUT}/card-${side}.png`, b);
}
r = await fetch(`${BASE}/api/card/image?t=${T}&side=front&dl=1`); ok((r.headers.get('content-disposition') || '').includes(`forge30-student-card-${sid}-front.png`), 'download sets attachment filename');
ok((await fetch(`${BASE}/api/card/image?t=tampered&side=front`)).status === 401, 'card image with bad token -> 401');
ok((await fetch(`${BASE}/api/admin/photo/${id}`)).status === 401, 'admin photo route requires admin');
r = await fetch(`${BASE}/api/admin/photo/${id}`, { headers: A }); const stored = Buffer.from(await r.arrayBuffer()); const sm = await sharp(stored).metadata();
ok(r.status === 200 && sm.width === 413 && sm.height === 531 && !sm.exif, 'stored photo is passport size 413×531 (35×45 mm @300dpi) with EXIF stripped');

// photo policy: first upload free, ONE change, then locked until an admin verifies ID
r = await photoTest(jpeg); ok(r.status === 200 && (await r.json()).changesLeft === 0, 'photo: the one allowed change succeeds (0 left)');
r = await photoTest(jpeg); j = await r.json(); ok(r.status === 403 && j.locked && /legal document/.test(j.error), 'photo: a second change is refused and asks for a legal document');
ok((await fetch(`${BASE}/api/admin/photo-unlock`, { method: 'POST', headers: J, body: JSON.stringify({ id: Number(id), idChecked: 'Ghana Card' }) })).status === 401, 'photo unlock requires admin');
ok((await fetch(`${BASE}/api/admin/photo-unlock`, { method: 'POST', headers: { ...J, ...A }, body: JSON.stringify({ id: Number(id) }) })).status === 400, 'photo unlock requires naming the document verified');
ok((await fetch(`${BASE}/api/admin/photo-unlock`, { method: 'POST', headers: { ...J, ...A }, body: JSON.stringify({ id: Number(id), idChecked: 'Ghana Card' }) })).status === 200, 'admin unlocks one more change after ID check');
ok((await photoTest(jpeg)).status === 200, 'photo: change works after unlock');
ok((await photoTest(jpeg)).status === 403, 'photo: locked again after using the unlock');
const det3 = strip(await (await fetch(`${BASE}/admin/applicants/${id}`, { headers: A })).text()); ok(/Photo changes used:\s*3\s*of\s*3/.test(det3.replace(/\s+/g, ' ')) || det3.includes('(locked)'), 'admin sees photo change count and locked state');
// 3D showcase + both faces
r = await img('3d'); { const b = Buffer.from(await r.arrayBuffer()); const m = await sharp(b).metadata().catch(() => ({})); ok(r.status === 200 && m.width === 1600 && m.height === 1000, '3D showcase: 1600×1000 PNG'); writeFileSync(`${OUT}/card-3d.png`, b); }
r = await img('front'); writeFileSync(`${OUT}/card-front.png`, Buffer.from(await r.arrayBuffer()));
// the QR on the card, decoded from the real PNG, must be a clean absolute https/http URL that goes to the verify page
for (const side of ['front', 'back']) {
  const { data, info } = await sharp(Buffer.from(await (await img(side)).arrayBuffer())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const qr = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  ok(!!qr && /^https?:\/\/[^\s/]+\/v\/[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(qr.data) && qr.data.endsWith('/v/' + serial), `QR on card ${side} decodes to a clean absolute link: ${qr?.data}`);
}
r = await fetch(`${BASE}/v/${serial}`, { redirect: 'manual' }); ok(r.status === 307 && r.headers.get('location').endsWith('/verify/' + serial), 'short link /v/<serial> redirects to the verify page');
ok((await fetch(`${BASE}/v/bad`, { redirect: 'manual' })).status === 404, 'short link rejects malformed serial');
ok((await fetch(`${BASE}/scan`)).status === 200, 'scan page available');
// public verify photo
r = await fetch(`${BASE}/api/verify/photo/${serial}`); ok(r.status === 200 && r.headers.get('content-type') === 'image/jpeg', 'verify photo served for an active card');
ok((await fetch(`${BASE}/api/verify/photo/AAAA-BBBB-CCCC`)).status === 404, 'verify photo: unknown serial 404');
ok((await fetch(`${BASE}/api/verify/photo/x'%20OR%201=1`)).status === 404, 'verify photo: malformed serial rejected');

// verification
let v = await (await fetch(`${BASE}/verify/${serial}`)).text(); ok(v.includes('Valid FORGE30 student card') && v.includes('Akosua Boateng-Owusu') && v.includes(`/api/verify/photo/${serial}`) && !v.includes(app.about.email) && !v.includes(app.about.phone), 'verify page: valid, shows name + photo, no contact details');
v = await (await fetch(`${BASE}/verify/AAAA-BBBB-CCCC`)).text(); ok(v.includes('Card not recognised'), 'verify page: unknown serial');
v = await (await fetch(`${BASE}/verify/'%20OR%201=1--`)).text(); ok(v.includes('Card not recognised'), 'verify page: injection string safely rejected');

// revocation
await fetch(`${BASE}/api/admin/applicants/${id}`, { method: 'PATCH', headers: { ...J, ...A }, body: JSON.stringify({ status: 'withdrawn' }) });
ok((await img()).status === 403, 'card stops rendering once status is no longer Confirmed');
v = await (await fetch(`${BASE}/verify/${serial}`)).text(); ok(v.includes('no longer active') && !v.includes('/api/verify/photo/'), 'verify page shows card inactive (no photo) after withdrawal');
ok((await fetch(`${BASE}/api/verify/photo/${serial}`)).status === 404, 'verify photo hidden once card is inactive');
await fetch(`${BASE}/api/admin/applicants/${id}`, { method: 'PATCH', headers: { ...J, ...A }, body: JSON.stringify({ status: 'confirmed' }) });
ok((await img()).status === 200, 'card works again after re-confirmation');
// sign out
r = await fetch(BASE + '/api/student/logout', { method: 'POST', headers: { ...J, ...S } }); ok(r.status === 200, 'student sign-out');
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
