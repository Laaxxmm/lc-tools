// Which exams get you into a given college, and which of those is the softest route.
//
// The ranking deliberately avoids "how many candidates sat this exam". Published
// figures contradict each other, and they conceal a trap: MAT's oft-quoted 3 lakh
// is spread across four sittings a year, so a single MAT sitting is nothing like
// CAT's one-shot pool. Instead the model uses three things a student can verify:
//
//   1. the percentile that college actually asks for on that exam
//   2. how many times a year the exam can be attempted
//   3. whether the college fills seats through that exam or only mops up with it
//
// (3) is the one most students get wrong. A college can "accept MAT" and still
// fill nearly every seat from CAT, leaving MAT for vacancies. A tool that lists
// MAT as an equal route there is actively misleading.

export type ExamId = 'cat' | 'xat' | 'nmat' | 'snap' | 'cmat' | 'mat' | 'atma' | 'pgcet' | 'mahcet';

export interface ExamMeta {
  id: ExamId;
  name: string;
  /** Sittings or attempts a candidate can use in one admission cycle. */
  attemptsPerYear: number;
  site: string;
}

export const EXAMS: Record<ExamId, ExamMeta> = {
  cat:    { id: 'cat',    name: 'CAT',        attemptsPerYear: 1, site: 'https://iimcat.ac.in/' },
  xat:    { id: 'xat',    name: 'XAT',        attemptsPerYear: 1, site: 'https://xatonline.in/' },
  nmat:   { id: 'nmat',   name: 'NMAT',       attemptsPerYear: 3, site: 'https://www.nmat.org/' },
  snap:   { id: 'snap',   name: 'SNAP',       attemptsPerYear: 3, site: 'https://snaptest.org/' },
  cmat:   { id: 'cmat',   name: 'CMAT',       attemptsPerYear: 1, site: 'https://exams.nta.ac.in/CMAT/' },
  mat:    { id: 'mat',    name: 'MAT',        attemptsPerYear: 4, site: 'https://mat.aima.in/' },
  atma:   { id: 'atma',   name: 'ATMA',       attemptsPerYear: 4, site: 'https://www.atmaaims.com/' },
  pgcet:  { id: 'pgcet',  name: 'Karnataka PGCET', attemptsPerYear: 1, site: 'https://cetonline.karnataka.gov.in/kea/' },
  mahcet: { id: 'mahcet', name: 'MAH CET',    attemptsPerYear: 1, site: 'https://cetcell.mahacet.org/' },
};

/** How the college actually uses the exam. */
export type Strength = 'primary' | 'secondary' | 'vacant';

export const STRENGTH_LABEL: Record<Strength, string> = {
  primary: 'Main intake route',
  secondary: 'Genuine second route',
  vacant: 'Only for leftover seats',
};

export interface Route {
  exam: ExamId;
  /** Percentile the college publishes for the general category, where it does. */
  cutoffPercentile?: number;
  /** What the college prints, verbatim, when it is not a plain percentile. */
  cutoffLabel: string;
  strength: Strength;
  note?: string;
}

export interface College {
  id: string;
  name: string;
  city: string;
  routes: Route[];
  /** The institute's own admissions page. Every route above is checkable here. */
  source: string;
}

export interface RankedRoute extends Route {
  meta: ExamMeta;
  /** Lower is easier. Unitless — for ordering only, never shown as a score. */
  effort: number;
  easiest: boolean;
  why: string;
}

const STRENGTH_PENALTY: Record<Strength, number> = {
  primary: 0,
  secondary: 6,
  // A route that only opens if seats are left over is not a plan you can make.
  vacant: 30,
};

/**
 * Order the routes into a college from softest to hardest.
 *
 * effort = required percentile, plus a penalty when the college does not really
 * fill seats this way, minus a credit for each extra attempt in the year.
 */
export function rankRoutes(college: College): RankedRoute[] {
  const ranked = college.routes.map((r) => {
    const meta = EXAMS[r.exam];
    const base = r.cutoffPercentile ?? 85;
    const attemptCredit = (meta.attemptsPerYear - 1) * 2.5;
    const effort = base + STRENGTH_PENALTY[r.strength] - attemptCredit;

    const bits: string[] = [];
    if (r.cutoffPercentile !== undefined) bits.push(`asks ${r.cutoffPercentile} percentile`);
    if (meta.attemptsPerYear > 1) bits.push(`${meta.attemptsPerYear} attempts a year`);
    if (r.strength === 'vacant') bits.push('only fills leftover seats');
    else if (r.strength === 'secondary') bits.push('a real second route');

    return { ...r, meta, effort, easiest: false, why: bits.join(' · ') };
  });

  ranked.sort((a, b) => a.effort - b.effort);
  // Only call something the easiest route when it is meaningfully clear of the
  // next one; two near-identical routes should not get a winner's badge.
  if (ranked.length > 0) {
    const clear = ranked.length === 1 || ranked[1].effort - ranked[0].effort >= 2;
    if (clear && ranked[0].strength !== 'vacant') ranked[0].easiest = true;
  }
  return ranked;
}

/** Every college that can be reached with a given exam. */
export function collegesForExam(colleges: College[], exam: ExamId): College[] {
  return colleges.filter((c) => c.routes.some((r) => r.exam === exam));
}

/** Exams that open up at least one of the chosen colleges, most useful first. */
export function examsCovering(colleges: College[]): { exam: ExamMeta; covers: string[] }[] {
  const map = new Map<ExamId, string[]>();
  for (const c of colleges) {
    for (const r of c.routes) {
      if (r.strength === 'vacant') continue;   // not a route you can plan around
      map.set(r.exam, [...(map.get(r.exam) ?? []), c.name]);
    }
  }
  return [...map.entries()]
    .map(([id, covers]) => ({ exam: EXAMS[id], covers }))
    .sort((a, b) => b.covers.length - a.covers.length || a.exam.name.localeCompare(b.exam.name));
}
