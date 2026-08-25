// Cost of an MBA, the loan EMI that funds it, and how long the payback takes.
//
// The line every other calculator leaves out is opportunity cost. Two years out
// of the workforce is money you earned before and will not earn during, and it
// is usually larger than the interest on the loan. Leaving it out makes an MBA
// look cheaper than it is, so it is a first-class output here.
//
// No discounting, no salary-growth curve, no tax. Every one of those needs an
// assumption the student cannot check, and a number they cannot check is a number
// they cannot trust. The page says plainly what is left out.

export interface RoiInput {
  totalFees: number;       // rupees, whole programme
  monthlyLiving: number;   // rupees per month during the course
  courseMonths: number;    // 1-60
  currentSalary: number;   // rupees per year before the MBA, 0 for a fresher
  expectedSalary: number;  // rupees per year after
  loanAmount: number;      // rupees, 0 if self-funded
  annualRate: number;      // loan interest, % per annum
  tenureMonths: number;    // loan tenure, 1-360
}

export interface RoiOutput {
  livingTotal: number;
  directCost: number;        // fees + living
  opportunityCost: number;   // salary you give up while studying
  totalInterest: number;     // the cost of borrowing, principal excluded
  totalCost: number;         // direct + opportunity + interest
  emi: number;
  totalRepayment: number;    // emi x tenure
  annualGain: number;        // expected salary - current salary, pre-tax
  breakEvenYears: number | null;   // null when the MBA does not raise your salary
  emiShareOfSalary: number;  // % of expected monthly salary
  monthlyExpectedSalary: number;
}

export type RoiResult = { ok: true; out: RoiOutput } | { ok: false; error: string };

export interface LoanYear {
  year: number;
  interestPaid: number;
  principalPaid: number;
  closingBalance: number;
}

export const MAX_COURSE_MONTHS = 60;
export const MAX_TENURE_MONTHS = 360;
export const MAX_RATE = 30;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Standard reducing-balance amortisation: EMI = P x r x (1+r)^n / ((1+r)^n - 1),
 * with r the monthly rate. At 0% the formula divides by zero, and the answer
 * there is simply the principal spread evenly.
 */
export function emiFor(principal: number, annualRate: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / tenureMonths;
  const growth = Math.pow(1 + r, tenureMonths);
  return (principal * r * growth) / (growth - 1);
}

/** Year-by-year split of what the EMI actually buys. Interest dominates early. */
export function loanSchedule(principal: number, annualRate: number, tenureMonths: number): LoanYear[] {
  if (principal <= 0 || tenureMonths <= 0) return [];
  const r = annualRate / 12 / 100;
  const emi = emiFor(principal, annualRate, tenureMonths);
  const years: LoanYear[] = [];
  let balance = principal;
  let interestPaid = 0;
  let principalPaid = 0;

  for (let m = 1; m <= tenureMonths; m += 1) {
    const interest = balance * r;
    // The last instalment clears whatever rounding left behind.
    const principalPart = m === tenureMonths ? balance : Math.min(emi - interest, balance);
    balance -= principalPart;
    interestPaid += interest;
    principalPaid += principalPart;
    if (m % 12 === 0 || m === tenureMonths) {
      years.push({
        year: years.length + 1,
        interestPaid: round2(interestPaid),
        principalPaid: round2(principalPaid),
        closingBalance: round2(Math.max(0, balance)),
      });
      interestPaid = 0;
      principalPaid = 0;
    }
  }
  return years;
}

function bad(n: number): boolean {
  return !Number.isFinite(n) || n < 0;
}

export function mbaRoi(i: RoiInput): RoiResult {
  if (bad(i.totalFees) || bad(i.monthlyLiving) || bad(i.loanAmount)) {
    return { ok: false, error: 'Fees, living cost and loan amount cannot be negative.' };
  }
  if (bad(i.currentSalary)) return { ok: false, error: 'Current salary cannot be negative.' };
  if (!Number.isFinite(i.expectedSalary) || i.expectedSalary <= 0) {
    return { ok: false, error: 'Enter the salary you expect after the MBA.' };
  }
  if (!Number.isFinite(i.courseMonths) || i.courseMonths < 1 || i.courseMonths > MAX_COURSE_MONTHS) {
    return { ok: false, error: `Course length must be between 1 and ${MAX_COURSE_MONTHS} months.` };
  }
  if (bad(i.annualRate) || i.annualRate > MAX_RATE) {
    return { ok: false, error: `Interest rate must be between 0 and ${MAX_RATE}%.` };
  }
  if (i.loanAmount > 0 && (!Number.isFinite(i.tenureMonths) || i.tenureMonths < 1 || i.tenureMonths > MAX_TENURE_MONTHS)) {
    return { ok: false, error: `Loan tenure must be between 1 and ${MAX_TENURE_MONTHS} months.` };
  }

  const livingTotal = i.monthlyLiving * i.courseMonths;
  const directCost = i.totalFees + livingTotal;
  const opportunityCost = (i.currentSalary * i.courseMonths) / 12;

  const emi = emiFor(i.loanAmount, i.annualRate, i.tenureMonths);
  const totalRepayment = emi * (i.loanAmount > 0 ? i.tenureMonths : 0);
  // Only the interest is an extra cost. The principal is already inside directCost,
  // so adding the full repayment would count the fees twice.
  const totalInterest = Math.max(0, totalRepayment - i.loanAmount);
  const totalCost = directCost + opportunityCost + totalInterest;

  const annualGain = i.expectedSalary - i.currentSalary;
  const monthlyExpectedSalary = i.expectedSalary / 12;

  return {
    ok: true,
    out: {
      livingTotal: round2(livingTotal),
      directCost: round2(directCost),
      opportunityCost: round2(opportunityCost),
      totalInterest: round2(totalInterest),
      totalCost: round2(totalCost),
      emi: round2(emi),
      totalRepayment: round2(totalRepayment),
      annualGain: round2(annualGain),
      breakEvenYears: annualGain > 0 ? round2(totalCost / annualGain) : null,
      emiShareOfSalary: round2((emi / monthlyExpectedSalary) * 100),
      monthlyExpectedSalary: round2(monthlyExpectedSalary),
    },
  };
}
