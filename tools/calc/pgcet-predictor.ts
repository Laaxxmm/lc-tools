// Karnataka PGCET college predictor.
//
// Built on KEA's own published closing ranks for 2023-2025. A lower rank number is
// better: if your rank is at or below a college's closing rank for your category in a
// given year, you would have been allotted that seat that year.
//
// Buckets come from how many of the available years you clear, not from a black-box
// score. Every result carries its per-year closing ranks so a student can check the
// reasoning rather than trust it.

export type Course = 'MBA' | 'MCA';
export type Chance = 'safe' | 'likely' | 'possible' | 'unlikely';

export interface CutoffData {
  source: string;
  years: string[];
  colleges: Record<string, string>;
  ranks: Record<string, Record<string, Record<string, Record<string, number>>>>;
}

export interface Prediction {
  collegeCode: string;
  collegeName: string;
  chance: Chance;
  yearsCleared: number;
  yearsAvailable: number;
  closingByYear: Record<string, number>;
  bestRank: number;   // hardest year (lowest closing rank)
  worstRank: number;  // easiest year (highest closing rank)
}

export interface PredictInput {
  rank: number;
  category: string;
  course: Course;
  data: CutoffData;
}

export const CHANCE_LABEL: Record<Chance, string> = {
  safe: 'Safe',
  likely: 'Likely',
  possible: 'Possible',
  unlikely: 'Unlikely',
};

const ORDER: Chance[] = ['safe', 'likely', 'possible', 'unlikely'];

export function categoriesFor(data: CutoffData, course: Course): string[] {
  const seen = new Set<string>();
  for (const byCat of Object.values(data.ranks[course] ?? {})) {
    for (const cat of Object.keys(byCat)) seen.add(cat);
  }
  return [...seen].sort();
}

export function predict(input: PredictInput): { results: Prediction[]; error?: string } {
  const { rank, category, course, data } = input;
  if (!Number.isFinite(rank) || rank < 1) {
    return { results: [], error: 'Enter your PGCET rank.' };
  }
  if (!Number.isInteger(rank)) {
    return { results: [], error: 'Rank must be a whole number.' };
  }
  const byCollege = data.ranks[course];
  if (!byCollege) return { results: [], error: `No data for ${course}.` };

  const out: Prediction[] = [];
  for (const [code, byCat] of Object.entries(byCollege)) {
    const closingByYear = byCat[category];
    if (!closingByYear) continue;                 // college never allotted this category

    const values = Object.values(closingByYear);
    if (values.length === 0) continue;

    const cleared = values.filter((closing) => rank <= closing).length;
    const total = values.length;

    let chance: Chance;
    if (cleared === total) chance = 'safe';
    else if (cleared * 2 > total) chance = 'likely';
    else if (cleared > 0) chance = 'possible';
    else chance = 'unlikely';

    out.push({
      collegeCode: code,
      collegeName: data.colleges[code] ?? code,
      chance,
      yearsCleared: cleared,
      yearsAvailable: total,
      closingByYear,
      bestRank: Math.min(...values),
      worstRank: Math.max(...values),
    });
  }

  // Most reachable first; within a bucket, the more selective college ranks higher.
  out.sort((a, b) => {
    const d = ORDER.indexOf(a.chance) - ORDER.indexOf(b.chance);
    return d !== 0 ? d : a.bestRank - b.bestRank;
  });
  return { results: out };
}

export function summarise(results: Prediction[]): Record<Chance, number> {
  const t: Record<Chance, number> = { safe: 0, likely: 0, possible: 0, unlikely: 0 };
  for (const r of results) t[r.chance] += 1;
  return t;
}
