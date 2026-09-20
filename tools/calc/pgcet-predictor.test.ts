import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  predict, summarise, categoryCode, citiesFor, programmesFor, seatsFor,
  CATEGORIES, COURSE_LABEL, NON_KARNATAKA_CODE, NO_CITY, REACH_MARGIN, SAFE_MARGIN,
  type CutoffData,
} from './pgcet-predictor.ts';

// Two programmes at one college, deliberately far apart: the real shape that
// makes collapsing to the college wrong.
const data: CutoffData = {
  source: 'test', year: '2025', rounds: ['r1', 'r2'],
  cities: ['Bengaluru', 'Mysuru'],
  colleges: {
    B001: { name: 'Alpha College', city: 'Bengaluru' },
    B002: { name: 'Beta College', city: 'Mysuru' },
    B003: { name: 'Gamma College', city: '' },      // city never resolved
  },
  ranks: {
    MBA: {
      B001: {
        MBA: {
          GM: { r1: 8000, r2: 10000 },        // still going in round 2, easier
          SCG: { r1: 30000, r2: 30000 },
          NKN: { r2: 9000 },                  // surrendered seat, round 2 only
        },
        'MBA Finance': { GM: { r1: 35000, r2: 35000 } },
      },
      // Filled in round 1 and never reopened: not an option for a late entrant.
      B002: { MBA: { GM: { r1: 20000 }, GMH: { r1: 21000, r2: 21000 } } },
      // Round 2 went to a BETTER rank than round 1 did.
      B003: { MBA: { GM: { r1: 28000, r2: 12000 } } },
    },
    MCA: {},
    // M.Tech: many specialisations per college, and no non-Karnataka column.
    MTECH: {
      T001: {
        'Computer Science And Engineering': { GM: { r1: 2804, r2: 3100 } },
        'Structural Engineering': { GM: { r1: 6870, r2: 6870 } },
        'VLSI Design And Embedded Systems': { GMH: { r1: 8146, r2: 8146 } },
      },
    },
  },
};

// Round 2 is the default everywhere; round 1 is asked for explicitly.
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
  assert.deepEqual(citiesFor(data, 'MBA', null), ['Bengaluru', 'Mysuru', NO_CITY]);
  assert.deepEqual(citiesFor(data, 'MCA', null), []);
});

test('a programme that stopped allotting after round 1 is not a round-2 option', () => {
  // B002's GM seat filled in round 1 and never reopened. Rank 1,000 clears its
  // round-1 rank comfortably, so only the round filter can keep it out.
  const r1 = predict({ ...base, round: 'r1', rank: 1000, category: 'GM' }).results;
  assert.ok(r1.some((r) => r.collegeCode === 'B002'), 'should exist in round 1');

  const r2 = predict({ ...base, round: 'r2', rank: 1000, category: 'GM' }).results;
  assert.ok(!r2.some((r) => r.collegeCode === 'B002'),
    'a seat with no round-2 allotment is not an option for a round-2 entrant');
});

test('round 2 is the default, and each row carries both rounds', () => {
  const row = predict({ ...base, rank: 9000, category: 'GM' })
    .results.find((r) => r.collegeCode === 'B001' && r.programme === 'MBA');
  assert.equal(row?.closingRank, 10000, 'judged against round 2');
  assert.equal(row?.round1, 8000);
  assert.equal(row?.round2, 10000);
  assert.equal(row?.tightened, false);
});

test('a round that went to a better rank than round 1 is flagged as tightened', () => {
  const row = predict({ ...base, rank: 11000, category: 'GM' })
    .results.find((r) => r.collegeCode === 'B003');
  assert.equal(row?.closingRank, 12000);
  assert.equal(row?.tightened, true, 'round 2 closed at 12,000 against round 1 28,000');
});

test('citiesFor respects the round too', () => {
  // B002 (Mysuru) has a GMH seat in both rounds but its GM seat is round 1 only.
  // B003 has GM in both rounds and no resolvable city, so Not stated is present
  // in both; Mysuru (B002) drops out in round 2 because its GM seat closed.
  assert.deepEqual(citiesFor(data, 'MBA', 'GM', 'r1'), ['Bengaluru', 'Mysuru', NO_CITY]);
  assert.deepEqual(citiesFor(data, 'MBA', 'GM', 'r2'), ['Bengaluru', NO_CITY]);
});

test('citiesFor never offers a city with no seat in that category', () => {
  // Only B001 (Bengaluru) has a non-Karnataka seat, so Mysuru must not be
  // offered — picking it would be a dead end the student discovers by hand.
  assert.deepEqual(citiesFor(data, 'MBA', NON_KARNATAKA_CODE), ['Bengaluru']);
});

test('a non-Karnataka candidate competes in one pool, whatever their category', () => {
  // KEA's reservation does not reach candidates from outside the state, so the
  // category picked must not change the answer.
  const asGm = predict({ ...base, seat: 'nk', rank: 5000, category: 'GM' }).results;
  const asSc = predict({ ...base, seat: 'nk', rank: 5000, category: 'SC' }).results;
  assert.deepEqual(asSc, asGm);
  assert.equal(categoryCode('SC', 'nk'), NON_KARNATAKA_CODE);
  assert.equal(categoryCode('anything', 'nk'), NON_KARNATAKA_CODE);

  // It reads the NKN column, not GM: 9,000 not 10,000.
  assert.equal(asGm.find((r) => r.collegeCode === 'B001')?.closingRank, 9000);
  // And a college with no surrendered seat simply is not on the list.
  assert.ok(!asGm.some((r) => r.collegeCode === 'B002'));
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

test('seat types are offered only where that course publishes them', () => {
  // MBA has all three; M.Tech publishes no NKN column, so offering a
  // non-Karnataka option there would be a choice that can only return nothing.
  assert.deepEqual(seatsFor(data, 'MBA').map((s) => s.id), ['rok', 'kk', 'nk']);
  assert.deepEqual(seatsFor(data, 'MTECH').map((s) => s.id), ['rok', 'kk']);
  assert.deepEqual(seatsFor(data, 'MCA').map((s) => s.id), []);
});

test('M.Tech specialisations at one college are judged separately', () => {
  // One college, two GM specialisations with very different boundaries. At rank
  // 3,000 Structural (6,870) is comfortably safe while CSE (3,100) is only
  // moderate, so safest-first puts Structural on top even though CSE is the
  // more selective seat. That ordering is the point: the list leads with what
  // the rank actually holds, not with what looks most impressive.
  const rows = predict({ ...base, course: 'MTECH', rank: 3000, category: 'GM' }).results;
  assert.deepEqual(rows.map((r) => r.programme),
    ['Structural Engineering', 'Computer Science And Engineering']);
  assert.deepEqual(rows.map((r) => r.chance), ['safe', 'moderate']);

  // Past CSE's boundary only Structural survives — proof they are judged apart
  // rather than sharing one college-level number.
  const tight = predict({ ...base, course: 'MTECH', rank: 4000, category: 'GM' }).results;
  assert.deepEqual(tight.map((r) => r.programme), ['Structural Engineering']);
});

test('the branch filter narrows to one specialisation', () => {
  const only = predict({
    ...base, course: 'MTECH', rank: 3000, category: 'GM',
    programme: 'Structural Engineering',
  }).results;
  assert.deepEqual(only.map((r) => r.programme), ['Structural Engineering']);
});

test('programmesFor offers only specialisations with a seat in that category', () => {
  // VLSI at T001 is published under GMH only, so it must not appear for GM.
  assert.deepEqual(programmesFor(data, 'MTECH', 'GM'),
    ['Computer Science And Engineering', 'Structural Engineering']);
  assert.deepEqual(programmesFor(data, 'MTECH', 'GMH'),
    ['VLSI Design And Embedded Systems']);
});

test('course labels cover every course key in the data', () => {
  for (const course of Object.keys(data.ranks)) {
    assert.ok(COURSE_LABEL[course as keyof typeof COURSE_LABEL],
      `no label for course key ${course}`);
  }
});

test('every category maps to a distinct published code per seat type', () => {
  const codes = CATEGORIES.flatMap((c) => [c.rok, c.kk]);
  assert.equal(new Set(codes).size, codes.length);
});
