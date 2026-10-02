import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupFor, cohortFor, nextSeat, seatLabel, classCode } from '../src/lib/placement';

test('experience maps to groups', () => {
  assert.equal(groupFor('none'), 'LCS'); assert.equal(groupFor('basic'), 'LCS'); assert.equal(groupFor(undefined), 'LCS');
  assert.equal(groupFor('some'), 'ICS'); assert.equal(groupFor('prior'), 'ACS');
});
test('format maps to cohort', () => {
  assert.equal(cohortFor('in_person'), 'Wenchi CIC'); assert.equal(cohortFor('remote'), 'Online'); assert.equal(cohortFor('either'), 'Online');
});
test('seats run B-01..B-15 and reuse gaps', () => {
  assert.equal(seatLabel(1), 'B-01'); assert.equal(classCode(1), 'F30-001'); assert.equal(classCode(12), 'F30-012');
  assert.equal(nextSeat([]), 'B-01'); assert.equal(nextSeat(['B-01', 'B-03']), 'B-02');
  assert.equal(nextSeat(Array.from({ length: 15 }, (_, i) => seatLabel(i + 1))), null);
});
