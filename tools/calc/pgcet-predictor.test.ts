import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  predict, summarise, categoryCode, CATEGORIES, REACH_MARGIN, type CutoffData,
} from './pgcet-predictor.ts';

// Two programmes at one college, deliberately far apart: this is the real shape
// that makes collapsing to the college wrong.
const data: CutoffData = {
  source: 'test',
  years: ['2023', '2024'],
  colleges: { B001: 'Alpha College', B002: 'Beta College' },
  programmes: {
    'MB - MBA': { code: 'MB', name: 'MBA' },
    'BF - MBA-FINANCE': { code: 'BF', name: 'MBA Finance' },
  },
  ranks: {
    MBA: {
      B001: {
        'MB - MBA': { GM: { '2023': 5000, '2024': 6000 }, SCG: { '2023': 30000 } },
        'BF - MBA-FINANCE': { GM: { '2023': 35000, '2024': 36000 } },
      },
      B002: { 'MB - MBA': { GMH: { '2023': 20000, '2024': 21000 } } },
    },
    MCA: {},
  },
};

const base = { seat: 'rok' as const, course: 'MBA' as const, data };

test('a rank ahead of every year is safe', () => {
  const { results } = predict({ ...base, rank: 1000, category: 'GM' });
  assert.equal(results.find((r) => r.programmeCode === 'MB')?.chance, 'safe');
});

test('inside the easiest year but not the hardest is moderate', () => {
  // 5500 clears 2024's 6000 but not 2023's 5000.
  const r = predict({ ...base, rank: 5500, category: 'GM' })
    .results.find((x) => x.programmeCode === 'MB');
  assert.equal(r?.chance, 'moderate');
});

test('just past the easiest year is a reach, far past is dropped entirely', () => {
  const reach = predict({ ...base, rank: 6500, category: 'GM' })
    .results.find((x) => x.programmeCode === 'MB');
  assert.equal(reach?.chance, 'reach');       // 6500 <= 6000 * 1.15

  const gone = predict({ ...base, rank: 9000, category: 'GM' })
    .results.find((x) => x.programmeCode === 'MB');
  assert.equal(gone, undefined, 'out-of-reach rows must not pad the list');
});

test('the reach boundary is exactly REACH_MARGIN', () => {
  const edge = Math.floor(6000 * REACH_MARGIN);           // 6900
  assert.equal(
    predict({ ...base, rank: edge, category: 'GM' }).results
      .find((x) => x.programmeCode === 'MB')?.chance, 'reach');
  assert.equal(
    predict({ ...base, rank: edge + 1, category: 'GM' }).results
      .find((x) => x.programmeCode === 'MB'), undefined);
});

test('two programmes at one college are judged separately, never merged', () => {
  // The whole reason this is keyed by programme: at rank 30,000 the finance
  // programme is reachable and the general one is long gone.
  const { results } = predict({ ...base, rank: 30000, category: 'GM' });
  const atB001 = results.filter((r) => r.collegeCode === 'B001');
  assert.equal(atB001.length, 1);
  assert.equal(atB001[0].programmeCode, 'BF');
  assert.ok(!atB001.some((r) => r.programmeCode === 'MB'),
    'a college must not inherit its easiest programme’s cutoff');
});

test('boundary: a rank equal to the closing rank counts as admitted', () => {
  const r = predict({ ...base, rank: 5000, category: 'GM' })
    .results.find((x) => x.programmeCode === 'MB');
  assert.equal(r?.chance, 'safe');
});

test('seat type picks a different published category code', () => {
  assert.equal(categoryCode('GM', 'rok'), 'GM');
  assert.equal(categoryCode('GM', 'kk'), 'GMH');
  assert.equal(categoryCode('2A', 'kk'), '2AH');
  assert.equal(categoryCode('nope', 'rok'), null);

  // B002 only ever published GMH, so it appears under 371(j) and not otherwise.
  assert.ok(!predict({ ...base, rank: 1000, category: 'GM' })
    .results.some((r) => r.collegeCode === 'B002'));
  assert.ok(predict({ ...base, seat: 'kk', rank: 1000, category: 'GM' })
    .results.some((r) => r.collegeCode === 'B002'));
});

test('a category the programme never published is omitted, not guessed', () => {
  const { results } = predict({ ...base, rank: 1000, category: 'ST' });
  assert.equal(results.length, 0);
});

test('a single-year programme still classifies', () => {
  const r = predict({ ...base, rank: 1000, category: 'SC' })
    .results.find((x) => x.collegeCode === 'B001');
  assert.equal(r?.chance, 'safe');
  assert.deepEqual(Object.keys(r!.closingByYear), ['2023']);
});

test('rejects a rank that is not a whole number above zero', () => {
  for (const rank of [0, -5, 12.5, NaN]) {
    assert.ok(predict({ ...base, rank, category: 'GM' }).error, `rank ${rank}`);
  }
});

test('results run safest first', () => {
  const { results } = predict({ ...base, rank: 5500, category: 'GM' });
  const bands = results.map((r) => r.chance);
  assert.deepEqual([...bands].sort(
    (a, b) => ['safe','moderate','reach'].indexOf(a) - ['safe','moderate','reach'].indexOf(b),
  ), bands);
});

test('summarise counts every returned row exactly once', () => {
  const { results } = predict({ ...base, rank: 30000, category: 'GM' });
  const s = summarise(results);
  assert.equal(s.safe + s.moderate + s.reach, results.length);
});

test('every category maps to a distinct published code per seat type', () => {
  const codes = CATEGORIES.flatMap((c) => [c.rok, c.kk]);
  assert.equal(new Set(codes).size, codes.length);
});
