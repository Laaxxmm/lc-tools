// Eligibility across the ten entrance exams an Indian MBA or MCA aspirant actually sits.
//
// The rules are not uniform, and pretending otherwise is the standard mistake on every
// page that answers this question. Four of these bodies publish a percentage bar of their
// own. Four publish none and leave it to whichever institute reads the score. Two relax
// the bar only for candidates domiciled in that state, which makes the relaxation
// conditional rather than automatic. One wants 60% and Mathematics.
//
// Every row carries the rule text and the official page it came from, so each verdict is
// auditable. Where a rule varies by institute the row says so instead of asserting a number.

import { cgpaToPercent, type FormulaId } from './cgpa.ts';

export type Category = 'general' | 'ews' | 'obc-ncl' | 'sc' | 'st' | 'pwd';
export type Stream = 'engineering' | 'science' | 'commerce' | 'arts' | 'professional' | 'other';
export type Verdict = 'eligible' | 'depends' | 'not-eligible';

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'general', label: 'General / Unreserved' },
  { id: 'ews', label: 'EWS' },
  { id: 'obc-ncl', label: 'OBC (non-creamy layer)' },
  { id: 'sc', label: 'SC' },
  { id: 'st', label: 'ST' },
  { id: 'pwd', label: 'PwD / Differently Abled' },
];

export const STREAMS: { id: Stream; label: string }[] = [
  { id: 'engineering', label: 'Engineering or Technology (B.E., B.Tech)' },
  { id: 'science', label: 'Science or Computer Applications (B.Sc, BCA, BIT)' },
  { id: 'commerce', label: 'Commerce or Management (B.Com, BBA, BMS)' },
  { id: 'arts', label: 'Arts, Humanities or Social Sciences (B.A.)' },
  { id: 'professional', label: 'Professional qualification only (CA, CS, CMA)' },
  { id: 'other', label: 'Something else' },
];

interface ExamRule {
  id: string;
  exam: string;
  /** null = the exam body publishes no percentage bar. setBy then names who does. */
  minPercent: number | null;
  setBy?: string;
  relaxedPercent?: number;
  relaxedFor?: Category[];
  /** Categories whose relaxation carries a condition this tool cannot verify (domicile, notification). */
  conditionalFor?: Category[];
  relaxCondition?: string;
  needsMaths?: boolean;
  allowedStreams?: Stream[];
  rule: string;
  source: { label: string; href: string };
}

const RULES: ExamRule[] = [
  {
    id: 'cat',
    exam: 'CAT',
    minPercent: 50,
    relaxedPercent: 45,
    relaxedFor: ['sc', 'st', 'pwd'],
    rule: "A bachelor's degree of at least three years with 50% aggregate, or 45% for SC, ST and PwD candidates. Final-year students may apply. CA, CS and CMA are accepted in place of the degree at the same 50%.",
    source: { label: 'iimcat.ac.in', href: 'https://iimcat.ac.in/' },
  },
  {
    id: 'mat',
    exam: 'MAT',
    minPercent: null,
    setBy: 'AIMA',
    rule: "A bachelor's degree in any discipline, or the final year of one. AIMA publishes no minimum percentage for MAT itself.",
    source: { label: 'mat.aima.in', href: 'https://mat.aima.in/' },
  },
  {
    id: 'xat',
    exam: 'XAT',
    minPercent: null,
    setBy: 'XLRI',
    rule: "A bachelor's degree of at least three years in any discipline. XLRI publishes no percentage bar for the test, and every XAT-accepting institute sets its own.",
    source: { label: 'xatonline.in', href: 'https://xatonline.in/' },
  },
  {
    id: 'nmat',
    exam: 'NMAT by GMAC',
    minPercent: null,
    setBy: 'GMAC',
    rule: "A completed bachelor's degree. GMAC sets no percentage bar for the test. NMIMS, the largest user of the score, asks for 50% in graduation.",
    source: { label: 'nmat.org', href: 'https://www.nmat.org/' },
  },
  {
    id: 'snap',
    exam: 'SNAP',
    minPercent: 50,
    relaxedPercent: 45,
    relaxedFor: ['sc', 'st'],
    rule: 'A graduate degree from a recognised university with 50% aggregate, or 45% for SC and ST candidates. Final-year students may apply and submit proof of graduation later.',
    source: { label: 'snaptest.org', href: 'https://www.snaptest.org/' },
  },
  {
    id: 'cmat',
    exam: 'CMAT',
    minPercent: null,
    setBy: 'NTA',
    rule: 'A degree in any discipline, or the final year of one. NTA publishes no percentage bar for CMAT, and the AICTE-approved institutes taking the score set their own.',
    source: { label: 'exams.nta.ac.in', href: 'https://exams.nta.ac.in/CMAT/' },
  },
  {
    id: 'nimcet',
    exam: 'NIMCET',
    minPercent: 60,
    relaxedPercent: 55,
    relaxedFor: ['sc', 'st', 'pwd'],
    conditionalFor: ['pwd'],
    relaxCondition: "NIMCET fixes 55% for SC and ST. The PwD provision is written into each year's notification rather than carried forward, so read that document before you count on it.",
    needsMaths: true,
    allowedStreams: ['engineering', 'science'],
    rule: 'For MCA at the NITs: a B.Sc, B.Sc (Hons), BCA or BIT of at least three years, or a B.E./B.Tech, with 60% aggregate or 55% for SC and ST, plus Mathematics at 10+2 or degree level.',
    source: { label: 'nimcet.in', href: 'https://www.nimcet.in/' },
  },
  {
    id: 'cuet-pg',
    exam: 'CUET PG',
    minPercent: null,
    setBy: 'Each participating university',
    rule: 'NTA conducts the test and leaves eligibility to the university you apply to. Bars differ by university and by programme, and several ask for 50%.',
    source: { label: 'exams.nta.ac.in', href: 'https://exams.nta.ac.in/CUET-PG/' },
  },
  {
    id: 'pgcet',
    exam: 'Karnataka PGCET',
    minPercent: 50,
    relaxedPercent: 45,
    relaxedFor: ['sc', 'st'],
    conditionalFor: ['sc', 'st'],
    relaxCondition: 'KEA drops the bar to 45% only for SC, ST and Category-I candidates who hold Karnataka candidature under its eligibility clauses. Without that candidature the 50% bar stands.',
    rule: "A bachelor's degree of at least three years with 50% aggregate, and 45% for SC, ST and Category-I candidates of Karnataka. The MCA stream additionally needs Mathematics or Statistics. The 2026 cycle has concluded, so this is the standing rule for the next one.",
    source: { label: 'cetonline.karnataka.gov.in', href: 'https://cetonline.karnataka.gov.in/kea/' },
  },
  {
    id: 'mah-cet',
    exam: 'MAH CET (MBA/MMS)',
    minPercent: 50,
    relaxedPercent: 45,
    relaxedFor: ['sc', 'st', 'obc-ncl', 'ews', 'pwd'],
    conditionalFor: ['sc', 'st', 'obc-ncl', 'ews', 'pwd'],
    relaxCondition: 'The CET Cell gives 45% to reserved-category, EWS and PwD candidates of Maharashtra. If you are not domiciled in the state you are assessed at 50%.',
    rule: "A bachelor's degree of at least three years with 50% aggregate. Reserved-category, EWS and PwD candidates of Maharashtra need 45%. Final-year students may apply.",
    source: { label: 'cetcell.mahacet.org', href: 'https://cetcell.mahacet.org/' },
  },
];

export interface EligibilityInput {
  stream: Stream;
  category: Category;
  /** Still studying. Every exam here accepts final-year candidates. */
  finalYear: boolean;
  /** Mathematics or Statistics at 10+2 or in the degree. Decides NIMCET and the MCA routes. */
  hadMaths: boolean;
  workMonths: number;
  marksMode: 'percent' | 'cgpa';
  marks: number;
  formula: FormulaId;
  factor?: number;
}

export interface ExamVerdict {
  id: string;
  exam: string;
  verdict: Verdict;
  /** What decided it, for this candidate. */
  detail: string;
  /** The published rule, verbatim in substance. */
  rule: string;
  source: { label: string; href: string };
}

export interface EligibilityResult {
  ok: boolean;
  error?: string;
  percent?: number;
  /** Count of outright yeses. */
  clear?: number;
  exams?: ExamVerdict[];
  finalYearNote?: string;
  workNote?: string;
  streamNote?: string;
}

const FINAL_YEAR_NOTE =
  'Every exam here takes final-year students. You apply on the aggregate you hold now and produce the degree or the marks card when the institute asks for it, which is at admission rather than at application.';

const PROFESSIONAL_NOTE =
  "You picked CA, CS or CMA. CAT names those qualifications and accepts them at 50%. Most of the others are written around a three-year bachelor's degree, so if you do not hold one, read that exam's notification before you pay the fee.";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function workNote(months: number): string {
  if (months <= 0) {
    return 'None of these ten exams asks for work experience. Every one of them admits freshers, and an empty experience column disqualifies you nowhere on this list.';
  }
  return `Your ${months} months of work changes nothing about eligibility here. Experience earns weightage at shortlisting and interview in several institutes, and it is a hard requirement only on executive programmes, which these tests do not feed.`;
}

function decide(r: ExamRule, i: EligibilityInput, percent: number): { verdict: Verdict; detail: string } {
  if (r.allowedStreams && !r.allowedStreams.includes(i.stream)) {
    if (i.stream === 'other') {
      return {
        verdict: 'depends',
        detail: `${r.exam} names the degrees it accepts. Check that yours is one of them before you register.`,
      };
    }
    return {
      verdict: 'not-eligible',
      detail: `${r.exam} takes only the degrees named in its rule, and yours is not among them.`,
    };
  }

  if (r.needsMaths && !i.hadMaths) {
    return {
      verdict: 'not-eligible',
      detail: `You said you did not study Mathematics or Statistics at 10+2 or in your degree. ${r.exam} treats that as a hard requirement, not a preference.`,
    };
  }

  if (r.minPercent === null) {
    return {
      verdict: 'depends',
      detail: `${r.setBy} sets no percentage bar, so your ${percent}% does not stop you writing the test. The institute you send the score to sets the number that matters for admission.`,
    };
  }

  if (percent >= r.minPercent) {
    return { verdict: 'eligible', detail: `Your ${percent}% clears the ${r.minPercent}% aggregate this exam asks for.` };
  }

  const relaxed =
    r.relaxedPercent !== undefined && r.relaxedFor?.includes(i.category) ? r.relaxedPercent : null;

  if (relaxed !== null && percent >= relaxed) {
    if (r.conditionalFor?.includes(i.category)) {
      return {
        verdict: 'depends',
        detail: `Your ${percent}% clears the relaxed ${relaxed}% bar, but that relaxation carries a condition. ${r.relaxCondition ?? ''}`.trim(),
      };
    }
    return {
      verdict: 'eligible',
      detail: `Your ${percent}% sits under the ${r.minPercent}% general bar and clears the relaxed ${relaxed}% bar for your category.`,
    };
  }

  const need = relaxed ?? r.minPercent;
  if (i.finalYear) {
    return {
      verdict: 'depends',
      detail: `Your aggregate so far is ${percent}% and the bar is ${need}%. You are still studying, so the number is not final — you need ${round2(need - percent)} more percentage points by the time you graduate.`,
    };
  }
  return {
    verdict: 'not-eligible',
    detail: `Your ${percent}% is below the ${need}% this exam requires for your category, and your marks card is already final.`,
  };
}

export function checkEligibility(i: EligibilityInput): EligibilityResult {
  if (!Number.isFinite(i.workMonths) || i.workMonths < 0) {
    return { ok: false, error: 'Work experience cannot be negative. Enter 0 if you are a fresher.' };
  }

  let percent: number;
  if (i.marksMode === 'cgpa') {
    const converted = cgpaToPercent(i.marks, i.formula, i.factor);
    if (!converted.ok || converted.value === undefined) {
      return { ok: false, error: converted.error ?? 'Enter your CGPA.' };
    }
    percent = converted.value;
  } else {
    if (!Number.isFinite(i.marks)) return { ok: false, error: 'Enter your graduation percentage.' };
    if (i.marks < 0 || i.marks > 100) return { ok: false, error: 'Percentage must be between 0 and 100.' };
    percent = round2(i.marks);
  }

  // Compared on the rounded figure, which is the one shown. A verdict that argues with
  // the number printed beside it is worse than being 0.004 points imprecise.
  const exams: ExamVerdict[] = RULES.map((r) => {
    const { verdict, detail } = decide(r, i, percent);
    return { id: r.id, exam: r.exam, verdict, detail, rule: r.rule, source: r.source };
  });

  return {
    ok: true,
    percent,
    exams,
    clear: exams.filter((e) => e.verdict === 'eligible').length,
    finalYearNote: i.finalYear ? FINAL_YEAR_NOTE : undefined,
    workNote: workNote(i.workMonths),
    streamNote: i.stream === 'professional' ? PROFESSIONAL_NOTE : undefined,
  };
}
