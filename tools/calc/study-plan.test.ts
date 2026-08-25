import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPlan, planToText, sectionShares, shapeFor, todayIso, SECTIONS,
  type StudyPlan, type PlanInput,
} from './study-plan.ts';

const TODAY = '2026-08-26';

function plan(over: Partial<PlanInput> = {}): StudyPlan {
  const res = buildPlan({
    exam: 'cat', start: TODAY, examDate: '2026-11-29',
    hoursPerDay: 3, level: 'fresh', weakest: 'quant', ...over,
  });
  assert.ok(res.ok, res.ok ? '' : res.error);
  return res;
}

const phases = (p: StudyPlan) => [...new Set(p.weeks.map((w) => w.phase))];

test('CAT on 29 Nov 2026 from today is a 14-week build, foundation first and taper last', () => {
  const p = plan();
  assert.equal(p.daysLeft, 95);
  assert.equal(p.weeks.length, 14);
  assert.equal(p.shape, 'build');
  assert.equal(p.weeks[0].phase, 'foundation');
  assert.equal(p.weeks[p.weeks.length - 1].phase, 'taper');
  assert.deepEqual(phases(p), ['foundation', 'application', 'mock-block', 'taper']);
});

test('MAT on 13 Sep 2026 is a 3-week sprint with no concept building at all', () => {
  const p = plan({ exam: 'mat', examDate: '2026-09-13', weakest: 'ms' });
  assert.equal(p.daysLeft, 18);
  assert.equal(p.weeks.length, 3);
  assert.equal(p.shape, 'sprint');
  assert.deepEqual(phases(p), ['triage', 'mock-density', 'taper']);
  // The whole point: the short plan is a different plan, not the long one scaled down.
  for (const skipped of ['foundation', 'application', 'repair']) {
    assert.ok(!phases(p).includes(skipped as never), `sprint plan should never contain ${skipped}`);
  }
});

test('weeks are back-aligned so the final week is a full seven days', () => {
  const p = plan();
  assert.equal(p.weeks[0].days, 4);          // the short week lands first, where it costs least
  assert.equal(p.weeks[p.weeks.length - 1].days, 7);
  assert.equal(p.weeks.reduce((t, w) => t + w.days, 0), p.daysLeft);
  assert.equal(p.weeks[p.weeks.length - 1].to, '2026-11-28');  // day before the exam
});

test('every week accounts for all of its hours', () => {
  for (const p of [plan(), plan({ exam: 'mat', examDate: '2026-09-20', weakest: 'lc' })]) {
    for (const w of p.weeks) {
      assert.equal(w.mockHours + w.drillHours, w.hours, `week ${w.week} loses hours`);
      assert.ok(w.mocks >= 0 && w.mocks <= 3);
    }
  }
});

test('a fresh CAT candidate three weeks out is told the truth, not sold a foundation phase', () => {
  const p = plan({ examDate: '2026-09-16', level: 'fresh' });
  assert.equal(p.shape, 'sprint');
  assert.ok(p.flags.some((f) => f.includes('will not build a section from zero')));
});

test('level caps the shape: final sprint never gets a foundation phase', () => {
  assert.equal(shapeFor(14, 'sprint'), 'sprint');
  assert.equal(shapeFor(14, 'revising'), 'condensed');
  assert.equal(shapeFor(14, 'fresh'), 'build');
  assert.equal(shapeFor(3, 'fresh'), 'sprint');       // horizon wins when it is shorter
  const p = plan({ level: 'sprint' });
  assert.ok(!phases(p).includes('foundation'));
  assert.ok(p.flags.some((f) => f.includes('more than four weeks left')));
});

test('shares always sum to 1 and the weakest section gets the biggest boost far out', () => {
  for (const exam of ['cat', 'mat'] as const) {
    for (const s of SECTIONS[exam]) {
      for (const shape of ['build', 'condensed', 'sprint'] as const) {
        const shares = sectionShares(exam, s.id, shape);
        const total = [...shares.values()].reduce((a, b) => a + b, 0);
        assert.ok(Math.abs(total - 1) < 1e-9, `${exam}/${s.id}/${shape} sums to ${total}`);
        assert.ok((shares.get(s.id) ?? 0) > s.base, 'weak section must gain share');
      }
    }
  }
  const far = sectionShares('cat', 'quant', 'build').get('quant') ?? 0;
  const near = sectionShares('cat', 'quant', 'sprint').get('quant') ?? 0;
  assert.ok(far > near, 'the closer the exam, the less you over-invest in your weak section');
});

test('MAT IGE is capped, because AIMA keeps it out of the composite score', () => {
  const p = plan({ exam: 'mat', examDate: '2026-09-20', weakest: 'ige' });
  const ige = p.split.find((s) => s.id === 'ige');
  assert.ok(ige && ige.share <= 0.08, `IGE share ballooned to ${ige?.share}`);
  assert.ok(p.flags.some((f) => f.includes('Indian & Global Environment')));
});

test('boundary: exactly seven days left is a single taper week', () => {
  const p = plan({ examDate: '2026-09-02' });
  assert.equal(p.weeks.length, 1);
  assert.equal(p.weeks[0].days, 7);
  assert.equal(p.weeks[0].phase, 'taper');
  assert.ok(p.flags.some((f) => f.includes('One week left')));
});

test('boundary: one day left still produces a usable plan', () => {
  const p = plan({ examDate: '2026-08-27' });
  assert.equal(p.weeks.length, 1);
  assert.equal(p.weeks[0].days, 1);
  assert.equal(p.weeks[0].phase, 'taper');
});

test('rejects impossible input', () => {
  const bad = (over: Partial<PlanInput>) => buildPlan({
    exam: 'cat', start: TODAY, examDate: '2026-11-29',
    hoursPerDay: 3, level: 'fresh', weakest: 'quant', ...over,
  });
  assert.equal(bad({ examDate: '2026-08-26' }).ok, false);   // exam is today
  assert.equal(bad({ examDate: '2026-08-01' }).ok, false);   // exam has passed
  assert.equal(bad({ examDate: '2026-02-31' }).ok, false);   // date does not exist
  assert.equal(bad({ examDate: '29-11-2026' }).ok, false);   // wrong format
  assert.equal(bad({ start: 'tomorrow' }).ok, false);
  assert.equal(bad({ hoursPerDay: 0 }).ok, false);
  assert.equal(bad({ hoursPerDay: NaN }).ok, false);
  assert.equal(bad({ hoursPerDay: 20 }).ok, false);
  assert.equal(bad({ examDate: '2028-11-29' }).ok, false);   // beyond the horizon cap
  assert.equal(bad({ weakest: 'lc' }).ok, false);            // MAT section on a CAT plan
});

test('half an hour a day cannot fit a mock plus its analysis, and the plan says so', () => {
  const p = plan({ hoursPerDay: 0.5 });
  assert.equal(p.totalMocks, 0);
  assert.ok(p.flags.some((f) => f.includes('no room for a full mock')));
  // One hour a day still clears the bar, so the flag must not cry wolf.
  assert.ok(!plan({ hoursPerDay: 1 }).flags.some((f) => f.includes('no room for a full mock')));
});

test('the downloadable text carries every week and the official source', () => {
  const p = plan();
  const txt = planToText(p);
  for (const w of p.weeks) assert.ok(txt.includes(`Week ${w.week} —`), `missing week ${w.week}`);
  assert.ok(txt.includes('https://iimcat.ac.in/'));
  assert.ok(txt.includes('published by the exam body'));
  assert.ok(planToText(plan({ examDate: '2026-11-28' })).includes('not verified by us'));
});

test('todayIso reads the local calendar date, not UTC', () => {
  assert.equal(todayIso(new Date(2026, 7, 26, 0, 30)), '2026-08-26');
  assert.equal(todayIso(new Date(2026, 0, 1, 23, 59)), '2026-01-01');
});
