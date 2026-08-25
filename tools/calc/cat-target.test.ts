import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ANCHORS,
  BREAK_EVEN_ACCURACY,
  LADDER_ACCURACIES,
  MAX_SCORE,
  TOTAL_QUESTIONS,
  accuracyLadder,
  plan,
  scoreBand,
} from './cat-target.ts';

const evenly = (a: number) => ({ varc: a, dilr: a, qa: a });

test('the paper this models is 68 questions and 204 marks', () => {
  assert.equal(TOTAL_QUESTIONS, 68);
  assert.equal(MAX_SCORE, 204);
});

test('break-even accuracy falls out of the marking scheme, it is not a guess', () => {
  assert.equal(BREAK_EVEN_ACCURACY, 0.25);
});

test('an exact anchor returns that anchor untouched', () => {
  assert.deepEqual(scoreBand(99), { low: 86, high: 92 });
  assert.deepEqual(scoreBand(99.5), { low: 96, high: 103 });
});

test('both ends of the supported range are inclusive', () => {
  assert.deepEqual(scoreBand(70), { low: 30, high: 35 });
  assert.deepEqual(scoreBand(99.9), { low: 110, high: 118 });
});

test('an in-between percentile lands between its two anchors', () => {
  const band = scoreBand(99.25);
  assert.ok(band);
  assert.ok(band.high > 92 && band.high < 103, `99.25 gave ${band.high}`);
});

test('the band never falls as the percentile rises', () => {
  let last = 0;
  for (let p = 70; p <= 99.9; p += 0.1) {
    const band = scoreBand(Math.round(p * 10) / 10);
    assert.ok(band, `no band at ${p}`);
    assert.ok(band.high >= last, `band dipped at ${p}: ${band.high} after ${last}`);
    last = band.high;
  }
});

test('percentiles outside the reported range are refused, not extrapolated', () => {
  assert.equal(scoreBand(69.9), null);
  assert.equal(scoreBand(100), null);
  assert.equal(scoreBand(Number.NaN), null);
  assert.equal(plan(50, evenly(0.7)).ok, false);
});

test('the worked example on the page reproduces exactly', () => {
  // Rahul: IIM A/B/C, so 99.5. 75% VARC, 65% DILR, 70% QA.
  const out = plan(99.5, { varc: 0.75, dilr: 0.65, qa: 0.7 });
  assert.equal(out.ok, true);
  assert.equal(out.scoreHigh, 103);

  const [varc, dilr, qa] = out.sections ?? [];
  assert.equal(varc.marksPerAttempt, 2);
  assert.equal(varc.targetScore, 36.4);
  assert.equal(varc.attempts, 19);

  assert.equal(dilr.marksPerAttempt, 1.6);
  assert.equal(dilr.attempts, 21);

  assert.equal(qa.marksPerAttempt, 1.8);
  assert.equal(qa.attempts, 19);

  assert.equal(out.totalAttempts, 59);
  assert.equal(out.reachable, true);
});

test('attempting what the plan says returns at least the target score', () => {
  const out = plan(95, evenly(0.72));
  assert.equal(out.ok, true);
  for (const s of out.sections ?? []) {
    assert.ok(s.netScore >= s.targetScore, `${s.label} came up short: ${s.netScore} < ${s.targetScore}`);
  }
  assert.ok((out.totalNet ?? 0) >= (out.scoreHigh ?? 0));
});

test('accuracy at or below break-even is refused with the reason', () => {
  const at = plan(99, evenly(0.25));
  assert.equal(at.ok, false);
  assert.match(String(at.error), /lowers your score/);
  assert.equal(plan(99, evenly(0.24)).ok, false);
});

test('just above break-even is allowed, but flagged as out of reach', () => {
  const out = plan(99, evenly(0.26));
  assert.equal(out.ok, true);
  assert.equal(out.reachable, false);
  assert.ok((out.sections ?? [])[0].attempts > 24);
});

test('accuracy is a fraction, so anything outside 0 to 1 is rejected', () => {
  assert.equal(plan(99, evenly(1.5)).ok, false);
  assert.equal(plan(99, evenly(0)).ok, false);
  assert.equal(plan(99, evenly(Number.NaN)).ok, false);
  assert.equal(plan(99, { varc: 0.8, dilr: 0.8, qa: -0.1 }).ok, false);
});

test('nobody needs to attempt more than the section holds at sane accuracy', () => {
  const out = plan(99.9, evenly(0.85));
  assert.equal(out.reachable, true);
  for (const s of out.sections ?? []) {
    assert.ok(s.attempts <= s.questions, `${s.label} wants ${s.attempts} of ${s.questions}`);
  }
});

test('the ladder gives one row per accuracy and attempts fall as accuracy rises', () => {
  const rows = accuracyLadder(99, LADDER_ACCURACIES);
  assert.equal(rows.length, LADDER_ACCURACIES.length);
  for (let i = 1; i < rows.length; i++) {
    assert.ok(
      (rows[i].totalAttempts ?? 0) <= (rows[i - 1].totalAttempts ?? 0),
      `attempts rose at ${LADDER_ACCURACIES[i]}`,
    );
  }
});

test('the anchor table itself stays sorted and inside the paper', () => {
  for (let i = 1; i < ANCHORS.length; i++) {
    assert.ok(ANCHORS[i].percentile > ANCHORS[i - 1].percentile);
    assert.ok(ANCHORS[i].low > ANCHORS[i - 1].low);
    assert.ok(ANCHORS[i].high > ANCHORS[i].low);
    assert.ok(ANCHORS[i].high < MAX_SCORE);
  }
});
