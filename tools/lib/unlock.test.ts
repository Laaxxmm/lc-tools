import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isUnlocked, markUnlocked, UNLOCK_KEY, UNLOCK_TTL_MS } from './unlock.ts';

function memory(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}
const NOW = 1_800_000_000_000;

test('locked by default', () => assert.equal(isUnlocked(memory(), NOW), false));

test('marking unlocks every tool, not just the one that asked', () => {
  const s = memory();
  markUnlocked(s, NOW);
  assert.equal(isUnlocked(s, NOW, 'pgcet-college-predictor'), true);
  assert.equal(isUnlocked(s, NOW, 'cat-mat-study-plan-generator'), true);
});

test('expires after 30 days, exactly at the boundary', () => {
  const s = memory();
  markUnlocked(s, NOW);
  assert.equal(isUnlocked(s, NOW + UNLOCK_TTL_MS - 1), true);
  assert.equal(isUnlocked(s, NOW + UNLOCK_TTL_MS), false);
});

test('a timestamp from the future does not unlock (clock skew, tampering)', () => {
  const s = memory({ [UNLOCK_KEY]: JSON.stringify({ at: NOW + 60_000 }) });
  assert.equal(isUnlocked(s, NOW), false);
});

test('the old per-tool key still unlocks that tool only', () => {
  const s = memory({ 'lc-unlock:mba-cost-and-roi-calculator': '1' });
  assert.equal(isUnlocked(s, NOW, 'mba-cost-and-roi-calculator'), true);
  assert.equal(isUnlocked(s, NOW, 'pgcet-college-predictor'), false);
});

test('corrupt or throwing storage reads as locked, never throws', () => {
  assert.equal(isUnlocked(memory({ [UNLOCK_KEY]: '{not json' }), NOW), false);
  const throwing = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  assert.equal(isUnlocked(throwing, NOW), false);
  assert.doesNotThrow(() => markUnlocked(throwing, NOW));
  assert.equal(isUnlocked(null, NOW), false);
});
