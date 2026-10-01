import test from 'node:test';
import assert from 'node:assert/strict';
import { aboutSchema, availabilitySchema, deviceSchema, commitmentSchema, phoneOk, STEP_SCHEMAS } from '../src/lib/schema';

const paths = (r: any) => (r.success ? [] : r.error.issues.map((i: any) => i.path.join('.')));

test('phone validation', () => {
  for (const p of ['0241234567', '+233241234567', '024 123 4567', '024-123-4567']) assert.ok(phoneOk(p), p);
  for (const p of ['12', 'abc', '0241234', '+2332412345678901234']) assert.ok(!phoneOk(p), p);
});
test('about: email/phone/name errors reported together', () => {
  const r = aboutSchema.safeParse({ fullName: '', phone: '1', email: 'x', location: '', ageBracket: '', experience: '' });
  assert.deepEqual(paths(r).sort(), ['ageBracket', 'email', 'experience', 'fullName', 'location', 'phone']);
});
test('commitment: "no" can never pass', () => {
  const base = { why: 'x'.repeat(40), hopeToBuild: 'y'.repeat(30), practise: 'yes', seriousness: 'all', ackDiscipline: true };
  assert.ok(commitmentSchema.safeParse({ ...base, canCommit: 'yes' }).success);
  assert.ok(paths(commitmentSchema.safeParse({ ...base, canCommit: 'no' })).includes('canCommit'));
  assert.ok(paths(commitmentSchema.safeParse({ ...base, canCommit: 'yes', ackDiscipline: false })).includes('ackDiscipline'));
});
test('availability: contribution required only for in_person/either, all errors at once', () => {
  assert.ok(availabilitySchema.safeParse({ periods: ['evening'], format: 'remote' }).success);
  assert.deepEqual(paths(availabilitySchema.safeParse({ periods: ['evening'], format: 'in_person' })).sort(), ['contribPref', 'contribRange']);
  assert.ok(paths(availabilitySchema.safeParse({ periods: [], format: 'either' })).includes('periods'));
  assert.ok(paths(availabilitySchema.safeParse({ periods: ['other'], format: 'remote' })).includes('periodOther'));
});
test('device: shared computer asked only when no computer; all errors at once', () => {
  const ok = { phone: 'android', computer: 'win_laptop', internet: 'reliable', electricity: 'reliable', workspace: 'yes' };
  assert.ok(deviceSchema.safeParse(ok).success);
  assert.deepEqual(paths(deviceSchema.safeParse({ ...ok, computer: 'none' })), ['sharedComputer']);
  assert.ok(deviceSchema.safeParse({ ...ok, computer: 'none', sharedComputer: 'maybe' }).success);
});
test('text is sanitised', () => {
  const r = aboutSchema.parse({ fullName: ' <b>Ama</b>\u0000 ', phone: '0241234567', email: 'A@B.CO', location: 'Accra', ageBracket: '18-24', experience: 'none' });
  assert.equal(r.fullName, 'bAma/b'); assert.equal(r.email, 'a@b.co');
});

test('empty steps give human messages, never raw validator text (every step)', () => {
  for (const [step, schema] of Object.entries(STEP_SCHEMAS)) {
    const r = schema.safeParse({});
    assert.ok(!r.success, step);
    for (const i of r.error.issues) assert.ok(!/expected|received|Invalid input|undefined/i.test(i.message), `${step}.${i.path.join('.')}: ${i.message}`);
  }
});
