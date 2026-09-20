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

// Matches the payload's own keys, so no course needs translating on the way in.
export type Course = 'MBA' | 'MCA' | 'MTECH';

export const COURSE_LABEL: Record<Course, string> = {
  MBA: 'MBA', MCA: 'MCA', MTECH: 'M.Tech',
};
/** Which KEA allotment round to judge against. */
export type Round = 'r1' | 'r2';
export type Chance = 'safe' | 'moderate' | 'reach';
export type Seat = 'rok' | 'kk' | 'nk';

export interface College { name: string; city: string }

/** Closing rank per round. A round is absent when nothing was allotted in it. */
export interface Slot { r1?: number; r2?: number }

export interface CutoffData {
  source: string;
  year: string;
  rounds: Round[];
  cities: string[];
  colleges: Record<string, College>;
  // course -> college code -> programme -> category -> per-round closing rank
  ranks: Record<string, Record<string, Record<string, Record<string, Slot>>>>;
}

export interface Prediction {
  collegeCode: string;
  collegeName: string;
  city: string;
  programme: string;
  chance: Chance;
  /** The closing rank for the round being judged. */
  closingRank: number;
  round1?: number;
  round2?: number;
  /** True when round 2 went to a better rank than round 1 did. */
  tightened: boolean;
}

export interface PredictInput {
  rank: number;
  category: string;
  seat: Seat;
  course: Course;
  /** '' means every city, including colleges whose city we could not resolve. */
  city?: string;
  /**
   * '' means every programme. Only useful where a course has many: M.Tech runs
   * 120 specialisations and a structural engineer has no use for the VLSI rows.
   */
  programme?: string;
  /**
   * Which round to judge against. 'r2' is the one a late entrant needs: a
   * programme with no round-2 closing rank allotted nothing in round 2, so it
   * is not an option for them however reachable its round-1 rank looks.
   */
  round?: Round;
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

/**
 * Seat types that actually have a published cut-off for this course.
 *
 * M.Tech publishes no NKN column at all, so offering a non-Karnataka option
 * there would be a dead end presented as a choice. Same reasoning as citiesFor.
 */
export function seatsFor(data: CutoffData, course: Course): { id: Seat; label: string }[] {
  const present = new Set<string>();
  for (const byProgramme of Object.values(data.ranks[course] ?? {})) {
    for (const byCat of Object.values(byProgramme)) {
      for (const cat of Object.keys(byCat)) present.add(cat);
    }
  }
  return SEATS.filter((s) => {
    if (s.id === 'nk') return present.has(NON_KARNATAKA_CODE);
    const key = s.id;                       // narrowed to the two Karnataka pools
    return CATEGORIES.some((c) => present.has(c[key]));
  });
}

export const SEATS: { id: Seat; label: string }[] = [
  { id: 'rok', label: 'Rest of Karnataka' },
  { id: 'kk', label: '371(j) Kalyana Karnataka' },
  { id: 'nk', label: 'Non-Karnataka candidate' },
];

/**
 * The published code for the non-Karnataka pool.
 *
 * KEA prints it as NKN: seats college managements surrender back to KEA, which
 * is what a candidate with no Karnataka claim competes for. It is a single pool
 * with no caste split, because the state's reservation does not extend to
 * candidates from outside it -- an SC or OBC certificate from another state
 * buys nothing here. So picking this seat type makes the category irrelevant
 * and `categoryCode` ignores it rather than pretending otherwise.
 */
export const NON_KARNATAKA_CODE = 'NKN';

/** The published category code for a category + seat type pair. */
export function categoryCode(category: string, seat: Seat): string | null {
  // One pool, no caste split. The category the student picked is not consulted.
  if (seat === 'nk') return NON_KARNATAKA_CODE;
  const row = CATEGORIES.find((c) => c.id === category);
  return row ? row[seat] : null;
}

function bandOf(rank: number, closing: number): Chance | null {
  if (rank <= closing * SAFE_MARGIN) return 'safe';
  if (rank <= closing) return 'moderate';
  if (rank <= closing * REACH_MARGIN) return 'reach';
  return null;
}

/**
 * Cities that actually have a seat for this course AND this category, so the
 * filter can never offer a choice that returns nothing.
 *
 * The category matters: the non-Karnataka pool exists in about fifty programmes
 * statewide, concentrated in Bengaluru. Listing all twenty-five cities there
 * would hand a student six dead ends to discover one at a time.
 */
export function citiesFor(
  data: CutoffData, course: Course, categoryCodeOrNull: string | null, round: Round = 'r2',
): string[] {
  const seen = new Set<string>();
  let missing = false;
  for (const [code, byProgramme] of Object.entries(data.ranks[course] ?? {})) {
    const has = categoryCodeOrNull
      ? Object.values(byProgramme).some((cats) => cats[categoryCodeOrNull]?.[round] != null)
      : true;
    if (!has) continue;
    const city = data.colleges[code]?.city;
    if (city) seen.add(city);
    else missing = true;
  }
  const out = [...seen].sort((a, b) => a.localeCompare(b));
  if (missing) out.push(NO_CITY);
  return out;
}

/**
 * Programmes this course actually publishes for the given category and round,
 * so the branch filter cannot offer a specialisation that returns nothing.
 */
export function programmesFor(
  data: CutoffData, course: Course, categoryCodeOrNull: string | null, round: Round = 'r2',
): string[] {
  const seen = new Set<string>();
  for (const byProgramme of Object.values(data.ranks[course] ?? {})) {
    for (const [programme, byCat] of Object.entries(byProgramme)) {
      if (!categoryCodeOrNull || byCat[categoryCodeOrNull]?.[round] != null) {
        seen.add(programme);
      }
    }
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

export function predict(input: PredictInput): { results: Prediction[]; error?: string } {
  const {
    rank, category, seat, course, city = '', programme: wanted = '', round = 'r2', data,
  } = input;

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
      if (wanted && programme !== wanted) continue;
      const slot = byCat[code];
      if (!slot) continue;                      // never allotted this category

      const closing = slot[round];
      // Absent means this programme allotted nothing in the round being asked
      // about. For a round-2 entrant that is the whole point: a seat that filled
      // in round 1 and never reopened is not an option, however good its rank.
      if (closing == null) continue;

      const chance = bandOf(rank, closing);
      if (!chance) continue;                    // out of reach; do not pad the list

      out.push({
        collegeCode,
        collegeName: college.name,
        city: college.city,
        programme,
        chance,
        closingRank: closing,
        round1: slot.r1,
        round2: slot.r2,
        tightened: slot.r1 != null && slot.r2 != null && slot.r2 < slot.r1,
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
