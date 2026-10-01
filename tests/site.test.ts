import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOrigin } from '../src/lib/site';

test('normalizeOrigin always yields a clean absolute origin', () => {
  assert.equal(normalizeOrigin('https://forge30.shariftechnologies.online'), 'https://forge30.shariftechnologies.online');
  assert.equal(normalizeOrigin('forge30.shariftechnologies.online'), 'https://forge30.shariftechnologies.online');
  assert.equal(normalizeOrigin('https://forge30.example.com/'), 'https://forge30.example.com');
  assert.equal(normalizeOrigin(' https://forge30.example.com/some/path?x=1 '), 'https://forge30.example.com');
  assert.equal(normalizeOrigin('http://localhost:3000'), 'http://localhost:3000');
  assert.equal(normalizeOrigin(''), null);
  assert.equal(normalizeOrigin(undefined), null);
});
