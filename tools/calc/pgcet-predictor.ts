// Karnataka PGCET college predictor: a rank goes in, the reachable programmes
// come out.
//
// Built on KEA's published closing ranks for PGCET 2025, second round. A lower
// rank number is better: if your rank is at or below a programme's closing rank
// for your category, you would have been allotted that seat.
//
// Keyed by programme, never by college. Most colleges run more than one and the
// spread between them reaches tens of thousands of ranks, so a college-level
// number would be a different programme's answer wearing this one's name.
//
// Pure: the data is passed in, so this is testable without a network or a DOM.

export type Course = 'MBA' | 'MCA';
export type Chance = 'safe' | 'moderate' | 'reach';
export type Seat = 'rok' | 'kk';

export interface College { name: string; city: string }

export interface CutoffData {
  source: string;
  year: string;
  round: string;
  cities: string[];
  colleges: Record<string, College>;
  // course -> college code -> programme -> category -> closing rank
  ranks: Record<string, Record<string, Record<string, Record<string, number>>>>;
}

export interface Prediction {
  collegeCode: string;
  collegeName: string;
  city: string;
  programme: string;
  chance: Chance;
  closingRank: number;
}

export interface PredictInput {
  rank: number;
  category: string;
  seat: Seat;
  course: Course;
  /** '' means every city, including colleges whose city we could not resolve. */
  city?: string;
  data: CutoffData;
}

export const CHANCE_LABEL: Record<Chance, string> = {
  safe: 'Safe',
  moderate: 'Moderate',
  reach: 'Reach',
};

/** Comfortably inside last year's boundary. */
export const SAFE_MARGIN = 0.85;
/** How far past the closing rank is still worth listing. */
export const REACH_MARGIN = 1.15;

/** Shown for a college whose city KEA's text never stated. */
export const NO_CITY = 'Not stated';

const ORDER: Chance[] = ['safe', 'moderate', 'reach'];

/**
 * Categories in KEA's own order.
 *
 * KEA publishes no seat type column: it encodes the seat type in the category.
 * A G suffix (or bare GM) is the Rest-of-Karnataka pool, an H suffix the 371(j)
 * Kalyana Karnataka pool. So the pair a student picks resolves to one code.
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

function bandOf(rank: number, closing: number): Chance | null {
  if (rank <= closing * SAFE_MARGIN) return 'safe';
  if (rank <= closing) return 'moderate';
  if (rank <= closing * REACH_MARGIN) return 'reach';
  return null;
}

/** Cities that actually have a programme for this course, for the filter. */
export function citiesFor(data: CutoffData, course: Course): string[] {
  const seen = new Set<string>();
  let missing = false;
  for (const code of Object.keys(data.ranks[course] ?? {})) {
    const city = data.colleges[code]?.city;
    if (city) seen.add(city);
    else missing = true;
  }
  const out = [...seen].sort((a, b) => a.localeCompare(b));
  if (missing) out.push(NO_CITY);
  return out;
}

export function predict(input: PredictInput): { results: Prediction[]; error?: string } {
  const { rank, category, seat, course, city = '', data } = input;

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
    const college = data.colleges[collegeCode] ?? { name: collegeCode, city: '' };
    if (city) {
      // NO_CITY is a real filter value: it selects exactly the colleges whose
      // city could not be resolved, so they stay reachable instead of hidden.
      const matches = city === NO_CITY ? college.city === '' : college.city === city;
      if (!matches) continue;
    }

    for (const [programme, byCat] of Object.entries(byProgramme)) {
      const closing = byCat[code];
      if (closing == null) continue;            // never allotted this category

      const chance = bandOf(rank, closing);
      if (!chance) continue;                    // out of reach; do not pad the list

      out.push({
        collegeCode,
        collegeName: college.name,
        city: college.city,
        programme,
        chance,
        closingRank: closing,
      });
    }
  }

  // Safest first; inside a band the more selective programme leads, because that
  // is the one worth putting higher in option entry.
  out.sort((a, b) => {
    const d = ORDER.indexOf(a.chance) - ORDER.indexOf(b.chance);
    if (d !== 0) return d;
    if (a.closingRank !== b.closingRank) return a.closingRank - b.closingRank;
    return a.collegeName.localeCompare(b.collegeName);
  });
  return { results: out };
}

export function summarise(results: Prediction[]): Record<Chance, number> {
  const t: Record<Chance, number> = { safe: 0, moderate: 0, reach: 0 };
  for (const r of results) t[r.chance] += 1;
  return t;
}
