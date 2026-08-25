import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkEligibility, type EligibilityInput, type Verdict } from './eligibility.ts';

const base: EligibilityInput = {
  stream: 'engineering',
  category: 'general',
  finalYear: false,
  hadMaths: true,
  workMonths: 0,
  marksMode: 'percent',
  marks: 62,
  formula: 'direct10',
};

function verdict(id: string, over: Partial<EligibilityInput> = {}): Verdict {
  const r = checkEligibility({ ...base, ...over });
  assert.ok(r.ok, r.error);
  const e = r.exams!.find((x) => x.id === id);
  assert.ok(e, `no rule row for ${id}`);
  return e.verdict;
}

test('known good: 62% general engineer clears every published bar', () => {
  const r = checkEligibility(base);
  assert.equal(r.ok, true);
  assert.equal(r.percent, 62);
  assert.equal(r.exams!.length, 10);
  assert.equal(r.clear, 5);
  for (const id of ['cat', 'snap', 'pgcet', 'mah-cet', 'nimcet']) {
    assert.equal(verdict(id), 'eligible', id);
  }
});

test('NIMCET asks 60%, so 62% clears it and 59% does not', () => {
  assert.equal(verdict('nimcet', { marks: 62 }), 'eligible');
  assert.equal(verdict('nimcet', { marks: 59 }), 'not-eligible');
});

test('exams that publish no bar always come back conditional, never a false yes', () => {
  for (const id of ['mat', 'xat', 'nmat', 'cmat', 'cuet-pg']) {
    assert.equal(verdict(id, { marks: 91 }), 'depends', `${id} at 91%`);
    assert.equal(verdict(id, { marks: 41 }), 'depends', `${id} at 41%`);
  }
});

test('boundary: 50% exactly clears CAT, 49.99% does not', () => {
  assert.equal(verdict('cat', { marks: 50 }), 'eligible');
  assert.equal(verdict('cat', { marks: 49.99 }), 'not-eligible');
});

test('boundary: SC gets CAT at 45%, and 44.9% still fails', () => {
  assert.equal(verdict('cat', { marks: 45, category: 'sc' }), 'eligible');
  assert.equal(verdict('cat', { marks: 44.9, category: 'sc' }), 'not-eligible');
});

test('EWS and OBC get no CAT percentage relaxation — reservation is not a lower bar', () => {
  assert.equal(verdict('cat', { marks: 47, category: 'ews' }), 'not-eligible');
  assert.equal(verdict('cat', { marks: 47, category: 'obc-ncl' }), 'not-eligible');
  assert.equal(verdict('cat', { marks: 47, category: 'st' }), 'eligible');
});

test('state relaxations are conditional on domicile, not automatic', () => {
  // 47% sits in the relaxed band for both, so the domicile condition decides it.
  assert.equal(verdict('pgcet', { marks: 47, category: 'sc' }), 'depends');
  assert.equal(verdict('mah-cet', { marks: 47, category: 'obc-ncl' }), 'depends');
  // Above the general bar the condition stops mattering.
  assert.equal(verdict('pgcet', { marks: 51, category: 'sc' }), 'eligible');
  // SNAP's relaxation carries no condition, so the same candidate gets a plain yes.
  assert.equal(verdict('snap', { marks: 47, category: 'sc' }), 'eligible');
});

test('final year softens a miss to conditional and names the gap', () => {
  const r = checkEligibility({ ...base, marks: 48.5, finalYear: true });
  const cat = r.exams!.find((e) => e.id === 'cat')!;
  assert.equal(cat.verdict, 'depends');
  assert.match(cat.detail, /1\.5 more percentage points/);
  assert.ok(r.finalYearNote);
  // Same marks with the degree already in hand is a straight no.
  assert.equal(verdict('cat', { marks: 48.5 }), 'not-eligible');
});

test('NIMCET needs Mathematics and a science or engineering degree', () => {
  assert.equal(verdict('nimcet', { hadMaths: false }), 'not-eligible');
  assert.equal(verdict('nimcet', { stream: 'commerce' }), 'not-eligible');
  assert.equal(verdict('nimcet', { stream: 'arts' }), 'not-eligible');
  assert.equal(verdict('nimcet', { stream: 'other' }), 'depends');
  assert.equal(verdict('nimcet', { stream: 'science' }), 'eligible');
  // The Mathematics gate is NIMCET's alone; CAT does not care.
  assert.equal(verdict('cat', { hadMaths: false, stream: 'arts' }), 'eligible');
});

test('PwD NIMCET relaxation is notification-set, so it is flagged rather than asserted', () => {
  const r = checkEligibility({ ...base, marks: 57, category: 'pwd' });
  const n = r.exams!.find((e) => e.id === 'nimcet')!;
  assert.equal(n.verdict, 'depends');
  assert.match(n.detail, /notification/);
});

test('CGPA input runs through the university formula, including the VTU 0.75 deduction', () => {
  const r = checkEligibility({ ...base, marksMode: 'cgpa', marks: 5.6, formula: 'vtu' });
  assert.equal(r.percent, 48.5);
  assert.equal(r.exams!.find((e) => e.id === 'cat')!.verdict, 'not-eligible');

  const direct = checkEligibility({ ...base, marksMode: 'cgpa', marks: 5.6, formula: 'direct10' });
  assert.equal(direct.percent, 56);
  assert.equal(direct.exams!.find((e) => e.id === 'cat')!.verdict, 'eligible');
});

test('work experience never changes a verdict, and the note says so', () => {
  const fresher = checkEligibility(base);
  const experienced = checkEligibility({ ...base, workMonths: 30 });
  assert.deepEqual(
    fresher.exams!.map((e) => e.verdict),
    experienced.exams!.map((e) => e.verdict),
  );
  assert.match(fresher.workNote!, /admits freshers/);
  assert.match(experienced.workNote!, /30 months/);
});

test('rejects impossible input instead of guessing', () => {
  assert.equal(checkEligibility({ ...base, marks: 101 }).ok, false);
  assert.equal(checkEligibility({ ...base, marks: -1 }).ok, false);
  assert.equal(checkEligibility({ ...base, marks: NaN }).ok, false);
  assert.equal(checkEligibility({ ...base, workMonths: -3 }).ok, false);
  assert.equal(checkEligibility({ ...base, marksMode: 'cgpa', marks: 11 }).ok, false);
  assert.equal(checkEligibility({ ...base, marksMode: 'cgpa', marks: 8, formula: 'custom', factor: 0 }).ok, false);
});

test('every verdict carries a rule and an official source', () => {
  for (const e of checkEligibility(base).exams!) {
    assert.ok(e.rule.length > 40, `${e.id} rule too thin`);
    assert.ok(e.detail.length > 20, `${e.id} detail too thin`);
    assert.match(e.source.href, /^https:\/\//, `${e.id} source is not an https link`);
  }
});

test('the professional-qualification route gets its own caveat', () => {
  assert.ok(checkEligibility({ ...base, stream: 'professional' }).streamNote);
  assert.equal(checkEligibility(base).streamNote, undefined);
});
