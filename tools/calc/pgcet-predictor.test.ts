import { test } from 'node:test';
import assert from 'node:assert/strict';
import { predict, summarise, categoriesFor, type CutoffData } from './pgcet-predictor.ts';

const data: CutoffData = {
  source: 'test',
  years: ['2023', '2024', '2025'],
  colleges: { B001: 'Alpha College', B002: 'Beta College', B003: 'Gamma College' },
  ranks: {
    MBA: {
      B001: { GM: { '2023': 5000, '2024': 5200, '2025': 4800 } },
      B002: { GM: { '2023': 20000, '2024': 21000, '2025': 19500 } },
      B003: { SCG: { '2023': 30000 } },
    },
    MCA: {},
  },
};

test('rank better than every year is safe', () => {
  const { results } = predict({ rank: 1000, category: 'GM', course: 'MBA', data });
  assert.equal(results.find((r) => r.collegeCode === 'B001')?.chance, 'safe');
});

test('rank worse than every year is unlikely', () => {
  const { results } = predict({ rank: 99000, category: 'GM', course: 'MBA', data });
  assert.ok(results.every((r) => r.chance === 'unlikely'));
});

test('clearing 2 of 3 years is likely, 1 of 3 is possible', () => {
  // 5100 clears 2024 (5200) and... 2023 is 5000 so no; 2025 is 4800 so no. 1 of 3.
  const one = predict({ rank: 5100, category: 'GM', course: 'MBA', data })
    .results.find((r) => r.collegeCode === 'B001');
  assert.equal(one?.chance, 'possible');
  assert.equal(one?.yearsCleared, 1);

  // 4900 clears 2023 (5000) and 2024 (5200) but not 2025 (4800). 2 of 3.
  const two = predict({ rank: 4900, category: 'GM', course: 'MBA', data })
    .results.find((r) => r.collegeCode === 'B001');
  assert.equal(two?.chance, 'likely');
  assert.equal(two?.yearsCleared, 2);
});

test('boundary: rank exactly equal to closing rank counts as cleared', () => {
  const r = predict({ rank: 5000, category: 'GM', course: 'MBA', data })
    .results.find((x) => x.collegeCode === 'B001');
  assert.equal(r?.yearsCleared, 2); // clears 5000 and 5200, not 4800
});

test('colleges with no data for that category are omitted, not guessed', () => {
  const { results } = predict({ rank: 1000, category: 'GM', course: 'MBA', data });
  assert.ok(!results.some((r) => r.collegeCode === 'B003'));
});

test('single-year college still classifies', () => {
  const { results } = predict({ rank: 1000, category: 'SCG', course: 'MBA', data });
  const g = results.find((r) => r.collegeCode === 'B003');
  assert.equal(g?.yearsAvailable, 1);
  assert.equal(g?.chance, 'safe');
});

test('rejects invalid rank', () => {
  assert.ok(predict({ rank: 0, category: 'GM', course: 'MBA', data }).error);
  assert.ok(predict({ rank: 12.5, category: 'GM', course: 'MBA', data }).error);
  assert.ok(predict({ rank: NaN, category: 'GM', course: 'MBA', data }).error);
});

test('results are ordered most reachable first', () => {
  const { results } = predict({ rank: 19000, category: 'GM', course: 'MBA', data });
  assert.equal(results[0].collegeCode, 'B002'); // safe
  assert.equal(results[1].collegeCode, 'B001'); // unlikely
});

test('summarise counts buckets', () => {
  const { results } = predict({ rank: 19000, category: 'GM', course: 'MBA', data });
  const s = summarise(results);
  assert.equal(s.safe + s.likely + s.possible + s.unlikely, results.length);
});

test('categoriesFor lists every category present for the course', () => {
  assert.deepEqual(categoriesFor(data, 'MBA'), ['GM', 'SCG']);
});
