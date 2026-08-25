import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emiFor, loanSchedule, mbaRoi, type RoiInput } from './mba-roi.ts';

// The scenario the page walks through, so the prose and the code cannot drift apart.
const BASE: RoiInput = {
  totalFees: 1_500_000,
  monthlyLiving: 15_000,
  courseMonths: 24,
  currentSalary: 600_000,
  expectedSalary: 1_600_000,
  loanAmount: 1_500_000,
  annualRate: 10.5,
  tenureMonths: 84,
};

function ok(i: RoiInput) {
  const r = mbaRoi(i);
  assert.ok(r.ok, r.ok ? '' : r.error);
  return r.out;
}

test('EMI matches the published amortisation case: 10L at 12% over 120 months', () => {
  // Textbook reducing-balance figure for this loan is Rs 14,347.09 a month.
  assert.ok(Math.abs(emiFor(1_000_000, 12, 120) - 14347.09) < 0.01);
});

test('EMI matches a second known case: 5L at 9% over 60 months', () => {
  assert.ok(Math.abs(emiFor(500_000, 9, 60) - 10379.18) < 0.01);
});

test('a 0% loan is the principal spread evenly, not a divide by zero', () => {
  assert.equal(emiFor(100_000, 0, 10), 10_000);
  assert.equal(Number.isFinite(emiFor(100_000, 0, 10)), true);
});

test('no loan means no EMI and no interest', () => {
  const out = ok({ ...BASE, loanAmount: 0, tenureMonths: 0 });
  assert.equal(out.emi, 0);
  assert.equal(out.totalInterest, 0);
  assert.equal(out.totalCost, out.directCost + out.opportunityCost);
});

test('worked example on the page adds up', () => {
  const out = ok(BASE);
  assert.equal(out.livingTotal, 360_000);
  assert.equal(out.directCost, 1_860_000);
  assert.equal(out.opportunityCost, 1_200_000);       // two years of a 6L salary
  assert.equal(out.emi, 25_291.01);
  assert.equal(out.totalInterest, 624_444.82);
  assert.equal(out.totalCost, 3_684_444.82);
  assert.equal(out.breakEvenYears, 3.68);
  assert.equal(out.emiShareOfSalary, 18.97);
});

test('total cost counts loan interest but never the principal twice', () => {
  const out = ok(BASE);
  assert.equal(out.totalCost, out.directCost + out.opportunityCost + out.totalInterest);
  assert.ok(out.totalCost < out.directCost + out.opportunityCost + out.totalRepayment);
});

test('a fresher gives up nothing, so opportunity cost is zero', () => {
  const out = ok({ ...BASE, currentSalary: 0 });
  assert.equal(out.opportunityCost, 0);
  assert.equal(out.annualGain, 1_600_000);
});

test('opportunity cost scales with course length, not with a fixed two years', () => {
  const oneYear = ok({ ...BASE, courseMonths: 12 });
  assert.equal(oneYear.opportunityCost, 600_000);
  assert.equal(oneYear.livingTotal, 180_000);
});

test('no salary rise means no break-even, and we say so instead of inventing one', () => {
  assert.equal(ok({ ...BASE, expectedSalary: 600_000 }).breakEvenYears, null);
  assert.equal(ok({ ...BASE, expectedSalary: 500_000 }).breakEvenYears, null);
});

test('boundary: a one-month course and a 60-month course both compute', () => {
  assert.equal(mbaRoi({ ...BASE, courseMonths: 1 }).ok, true);
  assert.equal(mbaRoi({ ...BASE, courseMonths: 60 }).ok, true);
});

test('rejects impossible input', () => {
  assert.equal(mbaRoi({ ...BASE, courseMonths: 0 }).ok, false);
  assert.equal(mbaRoi({ ...BASE, courseMonths: 61 }).ok, false);
  assert.equal(mbaRoi({ ...BASE, expectedSalary: 0 }).ok, false);
  assert.equal(mbaRoi({ ...BASE, totalFees: -1 }).ok, false);
  assert.equal(mbaRoi({ ...BASE, annualRate: 31 }).ok, false);
  assert.equal(mbaRoi({ ...BASE, tenureMonths: 0 }).ok, false);
  assert.equal(mbaRoi({ ...BASE, expectedSalary: Number.NaN }).ok, false);
});

test('schedule clears the loan exactly and its interest matches the summary', () => {
  const rows = loanSchedule(BASE.loanAmount, BASE.annualRate, BASE.tenureMonths);
  assert.equal(rows.length, 7);
  assert.equal(rows[rows.length - 1].closingBalance, 0);

  const paidPrincipal = rows.reduce((s, r) => s + r.principalPaid, 0);
  assert.ok(Math.abs(paidPrincipal - BASE.loanAmount) < 1);

  const paidInterest = rows.reduce((s, r) => s + r.interestPaid, 0);
  assert.ok(Math.abs(paidInterest - ok(BASE).totalInterest) < 1);
});

test('schedule front-loads interest', () => {
  const rows = loanSchedule(BASE.loanAmount, BASE.annualRate, BASE.tenureMonths);
  assert.ok(rows[0].interestPaid > rows[rows.length - 1].interestPaid);
});

test('a tenure that is not a whole number of years still closes out', () => {
  const rows = loanSchedule(1_000_000, 10, 30);
  assert.equal(rows.length, 3);              // 12 + 12 + 6
  assert.equal(rows[2].closingBalance, 0);
});

test('no loan means no schedule', () => {
  assert.deepEqual(loanSchedule(0, 10, 84), []);
});
