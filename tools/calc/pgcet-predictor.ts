// Karnataka PGCET college predictor: a rank goes in, the colleges that closed
// near it come out.
//
// Built on KEA's own published closing ranks for 2023 and 2024. A lower rank
// number is better: if your rank is at or below a programme's closing rank for
// your category in a year, you would have been allotted that seat that year.
//
// Keyed by programme, never by college. 391 of 496 colleges run more than one
// programme and the spread between them reaches 31,583 ranks, so a college-level
// number would be a different programme's answer wearing this one's name.
//
// Everything here is pure: the data is passed in, so this is testable without a
// network or a DOM, and the page can render the same result on any input.

export type Course = 'MBA' | 'MCA';
export type Chance = 'safe' | 'moderate' | 'reach';
export type Seat = 'rok' | 'kk';

export interface CutoffData {
  source: string;
  years: string[];
  colleges: Record<string, string>;
  programmes: Record<string, { code: string; name: string }>;
  // course -> college code -> programme key -> category -> year -> closing rank
  ranks: Record<string, Record<string, Record<string, Record<string, Record<string, number>>>>>;
}

export interface Prediction {
  collegeCode: string;
  collegeName: string;
  programmeCode: string;
  programmeName: string;
  chance: Chance;
  closingByYear: Record<string, number>;
  strictest: number;   // hardest year — the lowest closing rank
  easiest: number;     // most permissive year — the highest closing rank
}

export interface PredictInput {
  rank: number;
  category: string;     // UI category, e.g. 'GM' or '2A'
  seat: Seat;
  course: Course;
  data: CutoffData;
}

export const CHANCE_LABEL: Record<Chance, string> = {
  safe: 'Safe',
  moderate: 'Moderate',
  reach: 'Reach',
};

/** How far past the easiest year we still bother showing a programme. */
export const REACH_MARGIN = 1.15;

const ORDER: Chance[] = ['safe', 'moderate', 'reach'];

/**
 * The categories a student picks from, in KEA's own order.
 *
 * KEA does not print a seat type column. It encodes it in the category itself:
 * a G suffix (or bare GM) is the Rest-of-Karnataka pool and an H suffix is the
 * 371(j) Kalyana Karnataka pool. So the pair the student chooses resolves to one
 * published category code.
 */
export const CATEGORIES = [
  { id: 'GM', label: 'General Merit (GM)', rok: 'GM', kk: 'GMH' },
  { id: '1', label: 'Category 1', rok: '1G', kk: '1H' },
  { id: '2A', label: '2A', rok: '2AG', kk: '2AH' },
  { id: '2B', label: '2B', rok: '2BG', kk: '2BH' },
  { id: '3A', label: '3A', rok: '3AG', kk: '3AH' },
  { id: '3B', label: '3B', rok: '3BG', kk: '3BH' },
  { id: 'SC', label: 'SC', rok: 'SCG', kk: 'SCH' },
  { id: 'ST', label: 'ST', rok: 'STG', kk: 'STH' },
] as const;

export const SEATS: { id: Seat; label: string }[] = [
  { id: 'rok', label: 'Rest of Karnataka' },
  { id: 'kk', label: '371(j) Kalyana Karnataka' },
];

/** The published category code for a category + seat type pair. */
export function categoryCode(category: string, seat: Seat): string | null {
  const row = CATEGORIES.find((c) => c.id === category);
  return row ? row[seat] : null;
}

function bandOf(rank: number, strictest: number, easiest: number): Chance | null {
  // Ahead of even the hardest year: you cleared this in every year we hold.
  if (rank <= strictest) return 'safe';
  // Inside the most permissive year: it went this far at least once.
  if (rank <= easiest) return 'moderate';
  // Just outside. Cut-offs drift outward some years, so it is worth listing.
  if (rank <= easiest * REACH_MARGIN) return 'reach';
  return null;
}

export function predict(input: PredictInput): { results: Prediction[]; error?: string } {
  const { rank, category, seat, course, data } = input;

  if (!Number.isFinite(rank) || rank < 1) {
    return { results: [], error: 'Enter your PGCET rank.' };
  }
  if (!Number.isInteger(rank)) {
    return { results: [], error: 'Rank must be a whole number.' };
  }
  const code = categoryCode(category, seat);
  if (!code) return { results: [], error: 'Pick your category.' };

  const byCollege = data.ranks[course];
  if (!byCollege) return { results: [], error: `No data for ${course}.` };

  const out: Prediction[] = [];
  for (const [collegeCode, byProgramme] of Object.entries(byCollege)) {
    for (const [progKey, byCat] of Object.entries(byProgramme)) {
      const closingByYear = byCat[code];
      if (!closingByYear) continue;            // never allotted this category

      const values = Object.values(closingByYear);
      if (values.length === 0) continue;

      const strictest = Math.min(...values);
      const easiest = Math.max(...values);
      const chance = bandOf(rank, strictest, easiest);
      if (!chance) continue;                   // out of reach; do not pad the list

      const prog = data.programmes[progKey] ?? { code: '', name: progKey };
      out.push({
        collegeCode,
        collegeName: data.colleges[collegeCode] ?? collegeCode,
        programmeCode: prog.code,
        programmeName: prog.name,
        chance,
        closingByYear,
        strictest,
        easiest,
      });
    }
  }

  // Safest first; inside a band the more selective programme leads, because that
  // is the one worth putting higher in option entry.
  out.sort((a, b) => {
    const d = ORDER.indexOf(a.chance) - ORDER.indexOf(b.chance);
    if (d !== 0) return d;
    if (a.strictest !== b.strictest) return a.strictest - b.strictest;
    return a.collegeName.localeCompare(b.collegeName);
  });
  return { results: out };
}

export function summarise(results: Prediction[]): Record<Chance, number> {
  const t: Record<Chance, number> = { safe: 0, moderate: 0, reach: 0 };
  for (const r of results) t[r.chance] += 1;
  return t;
}
