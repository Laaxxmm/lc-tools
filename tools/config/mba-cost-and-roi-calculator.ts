import { CTA, type ToolConfig } from '../lib/types.ts';

const tool: ToolConfig = {
  slug: 'mba-cost-and-roi-calculator',
  title: 'MBA Cost and ROI Calculator: What It Really Costs and When You Break Even',
  tagline:
    'Fees are the smallest part of the bill. Add living costs, the salary you give up and the interest on the loan, and you get the number worth deciding on.',
  eyebrow: 'Cost and ROI',
  family: 'general',
  description:
    'Add fees, living costs, forgone salary and loan interest to see what an MBA really costs, your monthly EMI, and how long the payback takes.',
  keywords: [
    'mba cost calculator',
    'mba roi calculator',
    'education loan emi calculator',
    'cost of mba in india',
    'mba opportunity cost',
    'mba break even calculator',
    'iim fees roi',
  ],
  shortName: "Cost & ROI calculator",
  icon: 'rupee',
  oneLiner: "True cost, EMI, and years to break even",
  readMinutes: 6,
  gate: 'email',
  updated: '2026-08-26',
  cta: CTA.matMocks,
  related: [
    'mba-exam-eligibility-checker',
    'mba-exam-dates-2026',
    'cat-percentile-target-calculator',
    'cat-mat-study-plan-generator',
    'cgpa-percentage-converter',
  ],
  faq: [
    {
      q: 'Why does this add my current salary to the cost of the MBA?',
      a: 'Because you stop earning it. If you make Rs 6 lakh a year and study full time for two years, you have given up Rs 12 lakh you would otherwise have banked, and that money is gone whether or not you took a loan. Economists call it opportunity cost. Most MBA cost calculators skip it because it makes the total look frightening, but skipping it is how a Rs 18 lakh programme quietly becomes a Rs 30 lakh decision. If you are a fresher with no job to leave, enter zero and the line disappears.',
    },
    {
      q: 'The total cost adds loan interest but not the loan amount. Is that a mistake?',
      a: 'No, and it is the part people get wrong most often. Your fees are already in the total once, under fees. The loan is not an extra expense, it is a way of paying that same bill later. What borrowing actually costs you is the interest on top, so that is the only loan figure added. Counting the full repayment as well would charge you for the same fees twice and inflate your break-even by years.',
    },
    {
      q: 'What interest rate should I put in?',
      a: 'Use the rate your bank quotes you in writing, not the headline rate in an advertisement. Public sector banks typically price education loans off an external benchmark, so a floating rate moves with the repo rate through the life of the loan and your EMI can change. If you are still shopping, run the calculator twice, once at the best rate you have been offered and once two percentage points higher, and see whether the decision survives the worse case.',
    },
    {
      q: 'Does the break-even figure account for tax?',
      a: 'It does not, and you should read the number with that in mind. The salary gain here is pre-tax, so the amount that actually reaches your account is smaller and the real payback is a little longer than the figure shown. Pulling in the other direction, the interest you pay on an education loan is deductible under Section 80E of the Income Tax Act for up to eight years, which lowers your effective cost. We left both out rather than bury two assumptions you cannot verify inside one number.',
    },
    {
      q: 'What is a safe EMI as a share of my salary?',
      a: 'Lenders usually get uncomfortable when total EMIs cross about half of take-home pay, and life gets uncomfortable well before that. Treat anything under 20 percent of expected monthly salary as workable, 20 to 35 percent as tight, and above 35 percent as a plan that depends on the placement going exactly as you hope. Remember the share here is calculated on CTC, and your in-hand pay is lower, so the real squeeze is worse than the percentage suggests.',
    },
    {
      q: 'My expected salary is a guess. How much can I trust the answer?',
      a: 'Treat it as a range, not a prediction. Take the median placement figure the school publishes for your intended specialisation rather than the highest package in the brochure, knock off a little for the gap between CTC and cash, and run the calculator again at that lower number. If the answer still works at the pessimistic salary, the decision is sound. If it only works at the top package, you are betting on an outcome that a minority of the batch gets.',
    },
    {
      q: 'I am paying from savings with no loan. Is this still useful?',
      a: 'Yes. Set the loan amount to zero and the EMI lines drop out, leaving fees, living costs and forgone salary, which is still the honest total. Self-funding removes the interest but not the cost. The money you spend from savings would otherwise have been invested, so a fully funded MBA is cheaper than a borrowed one, not free.',
    },
  ],
  sources: [
    { label: 'Vidya Lakshmi, the Government of India education loan portal', href: 'https://www.vidyalakshmi.co.in/' },
    { label: 'Income Tax Act, Section 80E (Income Tax Department)', href: 'https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx' },
    { label: 'RBI Master Directions on interest rates for advances', href: 'https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx' },
    { label: 'CAT 2026, IIM', href: 'https://iimcat.ac.in/' },
    { label: 'MAT 2026, AIMA', href: 'https://mat.aima.in/' },
  ],
};

export default tool;
