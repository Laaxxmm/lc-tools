import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  predict, summarise, categoryCode, citiesFor,
  CATEGORIES, NO_CITY, REACH_MARGIN, SAFE_MARGIN, type CutoffData,
} from './pgcet-predictor.ts';

// Two programmes at one college, deliberately far apart: the real shape that
// makes collapsing to the college wrong.
const data: CutoffData = {
  source: 'test', year: '2025', round: 'Second Round',
  cities: ['Bengaluru', 'Mysuru'],
  colleges: {
    B001: { name: 'Alpha College', city: 'Bengaluru' },
    B002: { name: 'Beta College', city: 'Mysuru' },
    B003: { name: 'Gamma College', city: '' },      // city never resolved
  },
  ranks: {
    MBA: {
      B001: { MBA: { GM: 10000, SCG: 30000 }, 'MBA Finance': { GM: 35000 } },
      B002: { MBA: { GM: 20000, GMH: 21000 } },
      B003: { MBA: { GM: 12000 } },
    },
    MCA: {},
  },
};

const base = { seat: 'rok' as const, course: 'MBA' as const, data };

test('comfortably inside the closing rank is safe', () => {
  const r = predict({ ...base, rank: 8000, category: 'GM' })
    .results.find((x) => x.collegeCode === 'B001' && x.programme === 'MBA');
  assert.equal(r?.chance, 'safe');           // 8000 <= 10000 * 0.85
});

test('inside the closing rank but past the safe margin is moderate', () => {
  const r = predict({ ...base, rank: 9500, category: 'GM' })
    .results.find((x) => x.collegeCode === 'B001' && x.programme === 'MBA');
  assert.equal(r?.chance, 'moderate');
});

test('just past the closing rank is a reach, far past is dropped', () => {
  const reach = predict({ ...base, rank: 11000, category: 'GM' })
    .results.find((x) => x.collegeCode === 'B001' && x.programme === 'MBA');
  assert.equal(reach?.chance, 'reach');      // 11000 <= 10000 * 1.15

  const gone = predict({ ...base, rank: 13000, category: 'GM' })
    .results.find((x) => x.collegeCode === 'B001' && x.programme === 'MBA');
  assert.equal(gone, undefined, 'out-of-reach rows must not pad the list');
});

test('band boundaries sit exactly on the margins', () => {
  const at = (n: number) => predict({ ...base, rank: n, category: 'GM' })
    .results.find((x) => x.collegeCode === 'B001' && x.programme === 'MBA')?.chance;
  assert.equal(at(10000 * SAFE_MARGIN), 'safe');
  assert.equal(at(10000 * SAFE_MARGIN + 1), 'moderate');
  assert.equal(at(10000), 'moderate', 'equal to the closing rank still got a seat');
  assert.equal(at(10000 + 1), 'reach');
  assert.equal(at(Math.floor(10000 * REACH_MARGIN)), 'reach');
  assert.equal(at(Math.floor(10000 * REACH_MARGIN) + 1), undefined);
});

test('two programmes at one college are judged separately, never merged', () => {
  // The whole reason this is keyed by programme: at 32,000 the finance
  // programme is reachable and the general one is long gone.
  const rows = predict({ ...base, rank: 32000, category: 'GM' })
    .results.filter((r) => r.collegeCode === 'B001');
  assert.deepEqual(rows.map((r) => r.programme), ['MBA Finance']);
});

test('seat type selects a different published category code', () => {
  assert.equal(categoryCode('GM', 'rok'), 'GM');
  assert.equal(categoryCode('GM', 'kk'), 'GMH');
  assert.equal(categoryCode('2A', 'kk'), '2AH');
  assert.equal(categoryCode('nope', 'rok'), null);

  // B002 published GMH as well, so 371(j) finds it at a different rank.
  const kk = predict({ ...base, seat: 'kk', rank: 15000, category: 'GM' })
    .results.find((r) => r.collegeCode === 'B002');
  assert.equal(kk?.closingRank, 21000);
});

test('city filter narrows to that city and nothing else', () => {
  const all = predict({ ...base, rank: 5000, category: 'GM' }).results;
  assert.ok(all.length > 1);

  const blr = predict({ ...base, rank: 5000, category: 'GM', city: 'Bengaluru' }).results;
  assert.ok(blr.length > 0);
  assert.ok(blr.every((r) => r.city === 'Bengaluru'));
  assert.ok(!blr.some((r) => r.collegeCode === 'B002'));
});

test('an unresolved city is filterable, not hidden', () => {
  // B003 has no city. It must appear with no filter, and under "Not stated".
  assert.ok(predict({ ...base, rank: 5000, category: 'GM' })
    .results.some((r) => r.collegeCode === 'B003'));

  const unknown = predict({ ...base, rank: 5000, category: 'GM', city: NO_CITY }).results;
  assert.deepEqual(unknown.map((r) => r.collegeCode), ['B003']);

  // and it must not leak into a named city
  assert.ok(!predict({ ...base, rank: 5000, category: 'GM', city: 'Bengaluru' })
    .results.some((r) => r.collegeCode === 'B003'));
});

test('citiesFor lists only cities present for that course, plus Not stated', () => {
  assert.deepEqual(citiesFor(data, 'MBA'), ['Bengaluru', 'Mysuru', NO_CITY]);
  assert.deepEqual(citiesFor(data, 'MCA'), []);
});

test('a category the programme never published is omitted, not guessed', () => {
  assert.equal(predict({ ...base, rank: 1000, category: 'ST' }).results.length, 0);
});

test('rejects a rank that is not a whole number above zero', () => {
  for (const rank of [0, -5, 12.5, NaN]) {
    assert.ok(predict({ ...base, rank, category: 'GM' }).error, `rank ${rank}`);
  }
});

test('results run safest first', () => {
  const bands = predict({ ...base, rank: 11000, category: 'GM' }).results.map((r) => r.chance);
  const order = ['safe', 'moderate', 'reach'];
  assert.deepEqual([...bands].sort((a, b) => order.indexOf(a) - order.indexOf(b)), bands);
});

test('summarise counts every returned row exactly once', () => {
  const { results } = predict({ ...base, rank: 11000, category: 'GM' });
  const s = summarise(results);
  assert.equal(s.safe + s.moderate + s.reach, results.length);
});

test('every category maps to a distinct published code per seat type', () => {
  const codes = CATEGORIES.flatMap((c) => [c.rok, c.kk]);
  assert.equal(new Set(codes).size, codes.length);
});
