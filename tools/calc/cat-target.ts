// CAT: work backwards from the school you want to the attempts each section needs.
//
// Honest starting point: the IIMs publish your scaled score and your percentile on
// your own scorecard and nothing else. There is no official score-to-percentile
// table and no published normalisation formula. The anchors below are the middle
// of the range candidates have reported for recent CATs, held as a band rather
// than a point, because a point would claim precision the data does not have.

export type SectionId = 'varc' | 'dilr' | 'qa';

export interface SectionSpec {
  id: SectionId;
  label: string;
  name: string;
  questions: number;
}

// CAT 2024 and CAT 2025 both ran this paper: 68 questions, 204 marks, 40 minutes
// a section. The IIMs have changed the count before and can change it again.
export const SECTIONS: readonly SectionSpec[] = [
  { id: 'varc', label: 'VARC', name: 'Verbal Ability & Reading Comprehension', questions: 24 },
  { id: 'dilr', label: 'DILR', name: 'Data Interpretation & Logical Reasoning', questions: 22 },
  { id: 'qa', label: 'QA', name: 'Quantitative Ability', questions: 22 },
];

export const MARKS_CORRECT = 3;
export const MARKS_WRONG = -1;                                                  // MCQs only
export const TOTAL_QUESTIONS = SECTIONS.reduce((n, s) => n + s.questions, 0);   // 68
export const MAX_SCORE = TOTAL_QUESTIONS * MARKS_CORRECT;                       // 204

// Expected marks from one attempt at accuracy a is 3a - 1(1 - a) = 4a - 1.
// Solve for zero and you get 0.25. Below that, attempting more lowers your score.
export const BREAK_EVEN_ACCURACY = MARKS_WRONG / (MARKS_WRONG - MARKS_CORRECT);

export const MIN_PERCENTILE = 70;
export const MAX_PERCENTILE = 99.9;

export interface Anchor { percentile: number; low: number; high: number; }

// Reported score bands out of 204, recent CAT cycles. Estimates, not official.
export const ANCHORS: readonly Anchor[] = [
  { percentile: 70, low: 30, high: 35 },
  { percentile: 80, low: 40, high: 45 },
  { percentile: 85, low: 46, high: 51 },
  { percentile: 90, low: 53, high: 58 },
  { percentile: 95, low: 64, high: 70 },
  { percentile: 98, low: 77, high: 83 },
  { percentile: 99, low: 86, high: 92 },
  { percentile: 99.5, low: 96, high: 103 },
  { percentile: 99.9, low: 110, high: 118 },
];

export interface Tier {
  id: string;
  label: string;
  schools: string;
  percentile: number;
  sectional: number;   // the sectional percentile that usually travels with it
}

// Shortlist bars a general-category candidate has faced in recent cycles, not the
// eligibility minimums the institutes publish. Those two numbers are far apart and
// the explainer says so.
export const TIERS: readonly Tier[] = [
  {
    id: 'iim-abc',
    label: 'IIM Ahmedabad, Bangalore, Calcutta',
    schools: 'The three oldest IIMs.',
    percentile: 99.5,
    sectional: 90,
  },
  {
    id: 'iim-older',
    label: 'IIM Lucknow, Indore, Kozhikode, Shillong',
    schools: 'The next set of established IIMs.',
    percentile: 98,
    sectional: 85,
  },
  {
    id: 'top-non-iim',
    label: 'FMS Delhi, MDI, SPJIMR, IIM Mumbai, IIT B-schools',
    schools: 'Top non-IIM programmes that shortlist on CAT.',
    percentile: 97,
    sectional: 85,
  },
  {
    id: 'iim-newer',
    label: 'Newer IIMs (Trichy, Udaipur, Kashipur, Ranchi, Raipur, Rohtak and later)',
    schools: 'IIMs set up from 2010 onwards.',
    percentile: 95,
    sectional: 80,
  },
  {
    id: 'good-private',
    label: 'Strong private B-schools (GIM, TAPMI, IMT, KJ Somaiya, Christ, Alliance)',
    schools: 'Private and university programmes that accept CAT.',
    percentile: 85,
    sectional: 70,
  },
];

export interface SectionPlan {
  id: SectionId;
  label: string;
  name: string;
  questions: number;
  accuracy: number;          // 0..1, as supplied
  marksPerAttempt: number;   // 4a - 1
  targetScore: number;       // this section's share of the target
  attempts: number;          // rounded up; may exceed the section's questions
  netScore: number;          // what those attempts return at this accuracy
  reachable: boolean;
}

export interface Plan {
  ok: boolean;
  error?: string;
  percentile?: number;
  scoreLow?: number;
  scoreHigh?: number;
  sections?: SectionPlan[];
  totalAttempts?: number;
  totalNet?: number;
  reachable?: boolean;
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

// Percentiles bunch hard at the top, so interpolating on the raw number would
// badly underestimate everything above 99. Interpolate on the count of nines
// instead: 90 -> -1, 99 -> 0, 99.9 -> 1.
const nines = (p: number): number => -Math.log10(100 - p);

export function scoreBand(percentile: number): { low: number; high: number } | null {
  if (!Number.isFinite(percentile)) return null;
  if (percentile < MIN_PERCENTILE || percentile > MAX_PERCENTILE) return null;

  for (let i = 1; i < ANCHORS.length; i++) {
    const hi = ANCHORS[i];
    const lo = ANCHORS[i - 1];
    if (percentile > hi.percentile) continue;
    const t = (nines(percentile) - nines(lo.percentile)) / (nines(hi.percentile) - nines(lo.percentile));
    return {
      low: Math.round(lo.low + t * (hi.low - lo.low)),
      high: Math.round(lo.high + t * (hi.high - lo.high)),
    };
  }
  return null;
}

/**
 * Target percentile plus your own section accuracies, in, attempts per section out.
 * Plans against the top of the band: aiming at the bottom leaves no margin for a
 * paper that turns out harder than last year's.
 */
export function plan(percentile: number, accuracy: Record<SectionId, number>): Plan {
  const band = scoreBand(percentile);
  if (!band) {
    return {
      ok: false,
      error: `Enter a target percentile between ${MIN_PERCENTILE} and ${MAX_PERCENTILE}.`,
    };
  }

  const sections: SectionPlan[] = [];
  for (const s of SECTIONS) {
    const a = accuracy[s.id];
    if (!Number.isFinite(a) || a <= 0 || a > 1) {
      return { ok: false, error: `Enter a ${s.label} accuracy between 1 and 100 percent.` };
    }
    if (a <= BREAK_EVEN_ACCURACY) {
      return {
        ok: false,
        error: `At ${round1(a * 100)}% accuracy in ${s.label}, every extra attempt lowers your score. `
          + `CAT marking needs better than ${BREAK_EVEN_ACCURACY * 100}%.`,
      };
    }

    const marksPerAttempt = MARKS_CORRECT * a + MARKS_WRONG * (1 - a);
    const targetScore = round1((band.high * s.questions) / TOTAL_QUESTIONS);
    const attempts = Math.ceil(targetScore / marksPerAttempt);

    sections.push({
      id: s.id,
      label: s.label,
      name: s.name,
      questions: s.questions,
      accuracy: a,
      marksPerAttempt: round1(marksPerAttempt),
      targetScore,
      attempts,
      netScore: round1(attempts * marksPerAttempt),
      reachable: attempts <= s.questions,
    });
  }

  return {
    ok: true,
    percentile,
    scoreLow: band.low,
    scoreHigh: band.high,
    sections,
    totalAttempts: sections.reduce((n, s) => n + s.attempts, 0),
    totalNet: round1(sections.reduce((n, s) => n + s.netScore, 0)),
    reachable: sections.every((s) => s.reachable),
  };
}

export const LADDER_ACCURACIES: readonly number[] = [0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9];

/** Same target, one row per accuracy. Shows how much accuracy buys you. */
export function accuracyLadder(percentile: number, accuracies: readonly number[]): Plan[] {
  return accuracies.map((a) => plan(percentile, { varc: a, dilr: a, qa: a }));
}
