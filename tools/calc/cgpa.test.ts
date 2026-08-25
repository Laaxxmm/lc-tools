import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cgpaToPercent, percentToCgpa, FORMULAS } from './cgpa.ts';

test('VTU subtracts 0.75 before scaling', () => {
  assert.equal(cgpaToPercent(8.5, 'vtu').value, 77.5);
  assert.equal(percentToCgpa(77.5, 'vtu').value, 8.5);
});

test('UGC 9.5 rule', () => {
  assert.equal(cgpaToPercent(8, 'ugc95').value, 76);
});

test('round trip is stable across every formula', () => {
  for (const id of Object.keys(FORMULAS) as (keyof typeof FORMULAS)[]) {
    const pct = cgpaToPercent(7.4, id, 10).value!;
    const back = percentToCgpa(pct, id, 10).value!;
    assert.ok(Math.abs(back - 7.4) < 0.02, `${id} round trip drifted: ${back}`);
  }
});

test('VTU below 0.75 CGPA clamps to 0 instead of going negative', () => {
  assert.equal(cgpaToPercent(0.5, 'vtu').value, 0);
});

test('rejects out-of-range input', () => {
  assert.equal(cgpaToPercent(11, 'vtu').ok, false);
  assert.equal(percentToCgpa(-1, 'vtu').ok, false);
  assert.equal(cgpaToPercent(NaN, 'vtu').ok, false);
});

test('custom formula requires a positive multiplier', () => {
  assert.equal(cgpaToPercent(8, 'custom', 0).ok, false);
  assert.equal(cgpaToPercent(8, 'custom', 9.5).value, 76);
});
