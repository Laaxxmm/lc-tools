import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  rankRoutes, collegesForExam, examsCovering, EXAMS,
  type College,
} from './college-routes.ts';

const college = (routes: College['routes']): College => ({
  id: 'x', name: 'Test B-School', city: 'Bengaluru', routes, source: 'https://example.edu/admissions',
});

test('a lower published cutoff is the easier route', () => {
  const r = rankRoutes(college([
    { exam: 'cat', cutoffPercentile: 95, cutoffLabel: '95', strength: 'primary' },
    { exam: 'cmat', cutoffPercentile: 80, cutoffLabel: '80', strength: 'primary' },
  ]));
  assert.equal(r[0].exam, 'cmat');
  assert.equal(r[0].easiest, true);
});

test('more attempts a year lowers effort', () => {
  // Same cutoff; MAT allows four sittings, CAT one.
  const r = rankRoutes(college([
    { exam: 'cat', cutoffPercentile: 85, cutoffLabel: '85', strength: 'primary' },
    { exam: 'mat', cutoffPercentile: 85, cutoffLabel: '85', strength: 'primary' },
  ]));
  assert.equal(r[0].exam, 'mat');
  assert.ok(r[0].effort < r[1].effort);
});

test('a vacant-seat route never wins, even with the lowest cutoff', () => {
  const r = rankRoutes(college([
    { exam: 'cat', cutoffPercentile: 92, cutoffLabel: '92', strength: 'primary' },
    { exam: 'mat', cutoffPercentile: 60, cutoffLabel: '60', strength: 'vacant' },
  ]));
  assert.equal(r[0].exam, 'mat', 'it still sorts lowest-effort first');
  assert.equal(r[0].easiest, false, 'but it is never badged as the easiest route');
});

test('no winner badge when two routes are within a hair of each other', () => {
  const r = rankRoutes(college([
    { exam: 'cat', cutoffPercentile: 90, cutoffLabel: '90', strength: 'primary' },
    { exam: 'xat', cutoffPercentile: 91, cutoffLabel: '91', strength: 'primary' },
  ]));
  assert.equal(r[0].easiest, false);
});

test('a single route is the easiest route by default', () => {
  const r = rankRoutes(college([
    { exam: 'cat', cutoffPercentile: 99, cutoffLabel: '99', strength: 'primary' },
  ]));
  assert.equal(r[0].easiest, true);
});

test('missing cutoff falls back without throwing', () => {
  const r = rankRoutes(college([
    { exam: 'snap', cutoffLabel: 'Shortlist varies by programme', strength: 'primary' },
  ]));
  assert.equal(r.length, 1);
  assert.ok(Number.isFinite(r[0].effort));
  assert.ok(!r[0].why.includes('asks'));
});

test('collegesForExam filters to colleges reachable by that exam', () => {
  const a = { ...college([{ exam: 'cat' as const, cutoffLabel: '95', strength: 'primary' as const }]), id: 'a', name: 'A' };
  const b = { ...college([{ exam: 'mat' as const, cutoffLabel: '80', strength: 'primary' as const }]), id: 'b', name: 'B' };
  assert.deepEqual(collegesForExam([a, b], 'mat').map((c) => c.id), ['b']);
});

test('examsCovering ranks by how many chosen colleges an exam opens', () => {
  const a = { ...college([
    { exam: 'cat' as const, cutoffLabel: '95', strength: 'primary' as const },
    { exam: 'mat' as const, cutoffLabel: '80', strength: 'primary' as const },
  ]), id: 'a', name: 'A' };
  const b = { ...college([{ exam: 'cat' as const, cutoffLabel: '90', strength: 'primary' as const }]), id: 'b', name: 'B' };
  const out = examsCovering([a, b]);
  assert.equal(out[0].exam.id, 'cat');
  assert.equal(out[0].covers.length, 2);
});

test('examsCovering ignores vacant-only routes — you cannot plan around them', () => {
  const a = { ...college([
    { exam: 'cat' as const, cutoffLabel: '95', strength: 'primary' as const },
    { exam: 'mat' as const, cutoffLabel: '60', strength: 'vacant' as const },
  ]), id: 'a', name: 'A' };
  assert.deepEqual(examsCovering([a]).map((e) => e.exam.id), ['cat']);
});

test('every exam in the table carries a real attempt count and official site', () => {
  for (const e of Object.values(EXAMS)) {
    assert.ok(e.attemptsPerYear >= 1, `${e.id} attempts`);
    assert.match(e.site, /^https:\/\//, `${e.id} site`);
  }
});
