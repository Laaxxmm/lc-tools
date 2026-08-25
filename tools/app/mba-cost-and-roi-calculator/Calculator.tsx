'use client';

import { useId, useState, type ChangeEvent } from 'react';
import LeadGate from '../../components/LeadGate';
import { loanSchedule, mbaRoi, type RoiInput } from '../../calc/mba-roi';

// No submit button. Everything recomputes as you type, and the answer is on the
// page before you touch a field — the result is never what the email buys.
// The email buys the year-by-year loan table underneath it.

const DEFAULTS: Record<keyof RoiInput, string> = {
  totalFees: '1500000',
  monthlyLiving: '15000',
  courseMonths: '24',
  currentSalary: '600000',
  expectedSalary: '1600000',
  loanAmount: '1500000',
  annualRate: '10.5',
  tenureMonths: '84',
};

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const rupees = (n: number) => `₹${inr.format(Math.round(n))}`;

function num(v: string): number {
  return v.trim() === '' ? Number.NaN : Number(v);
}

function years(n: number): string {
  const months = Math.round(n * 12);
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} month${m === 1 ? '' : 's'}`;
  return m === 0 ? `${y} year${y === 1 ? '' : 's'}` : `${y} yr ${m} mo`;
}

const NUMBER_STYLE = { fontSize: 28, fontWeight: 800, margin: '6px 0 0', lineHeight: 1.15 } as const;

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="card">
      <h3>{label}</h3>
      <p style={NUMBER_STYLE}>{value}</p>
      <p className="muted" style={{ marginBottom: 0 }}>{note}</p>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between', gap: 'var(--s3)',
        padding: '12px 0', borderTop: '1px solid var(--line)',
        fontWeight: strong ? 800 : 600,
      }}
    >
      <span>{label}</span>
      <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

export default function Calculator() {
  const id = useId();
  const [form, setForm] = useState(DEFAULTS);

  const set = (k: keyof RoiInput) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const input: RoiInput = {
    totalFees: num(form.totalFees),
    monthlyLiving: num(form.monthlyLiving),
    courseMonths: num(form.courseMonths),
    currentSalary: num(form.currentSalary),
    expectedSalary: num(form.expectedSalary),
    loanAmount: num(form.loanAmount),
    annualRate: num(form.annualRate),
    tenureMonths: num(form.tenureMonths),
  };

  const result = mbaRoi(input);
  const out = result.ok ? result.out : null;
  const schedule = out ? loanSchedule(input.loanAmount, input.annualRate, input.tenureMonths) : [];

  const field = (
    k: keyof RoiInput,
    label: string,
    props: { min: number; max?: number; step?: string; hint?: string },
  ) => (
    <div className="field">
      <label htmlFor={`${id}-${k}`}>{label}</label>
      <input
        id={`${id}-${k}`}
        type="number"
        inputMode="decimal"
        min={props.min}
        max={props.max}
        step={props.step ?? '1'}
        value={form[k]}
        onChange={set(k)}
      />
      {props.hint ? <p className="muted" style={{ margin: '6px 0 0' }}>{props.hint}</p> : null}
    </div>
  );

  return (
    <>
      <div className="card">
        <p className="eyebrow"><span className="dot" />What the programme costs you</p>
        <div className="grid" style={{ marginTop: 'var(--s3)' }}>
          {field('totalFees', 'Total course fees (₹)', { min: 0, step: '10000', hint: 'The whole programme, not one year.' })}
          {field('monthlyLiving', 'Living cost per month (₹)', { min: 0, step: '1000', hint: 'Hostel, food, travel, everything.' })}
          {field('courseMonths', 'Course length (months)', { min: 1, max: 60, hint: 'A full-time MBA is usually 24.' })}
        </div>

        <p className="eyebrow" style={{ marginTop: 'var(--s3)' }}><span className="dot" />What you earn, before and after</p>
        <div className="grid" style={{ marginTop: 'var(--s3)' }}>
          {field('currentSalary', 'Salary now (₹ per year)', { min: 0, step: '10000', hint: 'Enter 0 if you are a fresher.' })}
          {field('expectedSalary', 'Expected salary after (₹ per year)', { min: 1, step: '10000', hint: 'Use the median package, not the highest.' })}
        </div>

        <p className="eyebrow" style={{ marginTop: 'var(--s3)' }}><span className="dot" />The loan, if you are taking one</p>
        <div className="grid" style={{ marginTop: 'var(--s3)' }}>
          {field('loanAmount', 'Loan amount (₹)', { min: 0, step: '10000', hint: 'Set 0 if you are self-funding.' })}
          {field('annualRate', 'Interest rate (% per year)', { min: 0, max: 30, step: '0.05', hint: 'The rate your bank quoted in writing.' })}
          {field('tenureMonths', 'Repayment tenure (months)', { min: 1, max: 360, hint: '84 months is a common education loan term.' })}
        </div>

        {!result.ok ? <p className="error" role="alert">{result.error}</p> : null}
      </div>

      <div aria-live="polite">
        {out ? (
          <>
            <div style={{ marginTop: 'var(--s5)' }}>
              <p className="eyebrow"><span className="dot" />What the MBA actually costs you</p>
              <p className="price">{rupees(out.totalCost)}</p>
              <p className="muted" style={{ maxWidth: '58ch' }}>
                Fees, living, the salary you give up while you study, and the interest on the
                loan. The loan principal is not added again, because your fees are already in
                this total once.
              </p>
            </div>

            <div className="grid" style={{ marginTop: 'var(--s4)' }}>
              <Stat
                label="Monthly EMI"
                value={out.emi > 0 ? rupees(out.emi) : 'No loan'}
                note={out.emi > 0
                  ? `${rupees(out.totalRepayment)} repaid over ${form.tenureMonths} months.`
                  : 'You are paying from savings, so there is no instalment.'}
              />
              <Stat
                label="Years to break even"
                value={out.breakEvenYears === null ? 'No payback' : years(out.breakEvenYears)}
                note={out.breakEvenYears === null
                  ? 'The salary you entered is no higher than what you earn now.'
                  : `Counted from the day you graduate, on a pre-tax gain of ${rupees(out.annualGain)} a year.`}
              />
              <Stat
                label="EMI as a share of salary"
                value={out.emi > 0 ? `${out.emiShareOfSalary}%` : '0%'}
                note={out.emi > 0
                  ? `Of ${rupees(out.monthlyExpectedSalary)} a month. Your in-hand pay is lower, so the real squeeze is worse.`
                  : 'Nothing leaves your salary for a loan.'}
              />
              <Stat
                label="Salary you give up"
                value={rupees(out.opportunityCost)}
                note={out.opportunityCost > 0
                  ? 'Earned nowhere, borrowed from nobody, and gone all the same.'
                  : 'A fresher gives up nothing, so this line is zero for you.'}
              />
            </div>

            <div className="card" style={{ marginTop: 'var(--s4)', maxWidth: '52ch' }}>
              <h3>Where the money goes</h3>
              <div style={{ marginTop: 'var(--s2)' }}>
                <Row label="Course fees" value={rupees(input.totalFees)} />
                <Row label={`Living, ${form.courseMonths} months`} value={rupees(out.livingTotal)} />
                <Row label="Salary forgone" value={rupees(out.opportunityCost)} />
                <Row label="Loan interest" value={rupees(out.totalInterest)} />
                <Row label="Total" value={rupees(out.totalCost)} strong />
              </div>
            </div>

            <div style={{ marginTop: 'var(--s5)' }}>
              <LeadGate
                slug="mba-cost-and-roi-calculator"
                mode="email"
                heading="See the year-by-year loan breakdown"
                blurb="Your total is above and stays there. This opens what each year of the EMI is really buying, which is mostly interest at the start."
              >
                <h2>Year by year, what your EMI buys</h2>
                <p className="muted" style={{ maxWidth: '62ch' }}>
                  An EMI is a fixed amount split two ways, and the split moves. Early on most of
                  it clears interest and very little touches the balance, which is why paying a
                  lump sum into the loan in year one saves far more than the same sum in year six.
                </p>
                {schedule.length === 0 ? (
                  <p>You entered no loan, so there is nothing to amortise.</p>
                ) : (
                  <div style={{ overflowX: 'auto', marginTop: 'var(--s3)' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 460 }}>
                      <thead>
                        <tr>
                          {['Year', 'Interest paid', 'Principal cleared', 'Balance left'].map((h) => (
                            <th
                              key={h}
                              scope="col"
                              style={{
                                textAlign: h === 'Year' ? 'left' : 'right',
                                padding: '10px 12px', fontSize: 14, fontWeight: 700,
                                color: 'var(--muted)', borderBottom: '1.5px solid var(--line)',
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {schedule.map((r) => (
                          <tr key={r.year}>
                            <th
                              scope="row"
                              style={{
                                textAlign: 'left', padding: '10px 12px', fontWeight: 700,
                                borderBottom: '1px solid var(--line)',
                              }}
                            >
                              {r.year}
                            </th>
                            {[r.interestPaid, r.principalPaid, r.closingBalance].map((v, n) => (
                              <td
                                key={n}
                                style={{
                                  textAlign: 'right', padding: '10px 12px', whiteSpace: 'nowrap',
                                  borderBottom: '1px solid var(--line)',
                                }}
                              >
                                {rupees(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="muted" style={{ maxWidth: '62ch' }}>
                  Interest here is the price of the loan, not of the MBA. It is the one loan
                  figure inside your total cost above.
                </p>
              </LeadGate>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
