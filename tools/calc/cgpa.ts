// CGPA <-> percentage conversion.
//
// There is no single national formula. Most converters hardcode one and are
// silently wrong for everyone else, so the university's own rule is an input.
// VTU matters most for our Karnataka audience: it subtracts 0.75 before scaling.

export type FormulaId = 'vtu' | 'ugc95' | 'direct10' | 'anna' | 'custom';

export interface Formula {
  id: FormulaId;
  label: string;
  note: string;
  toPercent: (cgpa: number, factor?: number) => number;
  toCgpa: (percent: number, factor?: number) => number;
}

export const FORMULAS: Record<FormulaId, Formula> = {
  vtu: {
    id: 'vtu',
    label: 'VTU (Visvesvaraya Technological University)',
    note: 'Percentage = (CGPA − 0.75) × 10',
    toPercent: (c) => (c - 0.75) * 10,
    toCgpa: (p) => p / 10 + 0.75,
  },
  ugc95: {
    id: 'ugc95',
    label: 'CBSE / UGC 9.5 rule',
    note: 'Percentage = CGPA × 9.5',
    toPercent: (c) => c * 9.5,
    toCgpa: (p) => p / 9.5,
  },
  direct10: {
    id: 'direct10',
    label: 'Direct 10× (most autonomous colleges)',
    note: 'Percentage = CGPA × 10',
    toPercent: (c) => c * 10,
    toCgpa: (p) => p / 10,
  },
  anna: {
    id: 'anna',
    label: 'Anna University',
    note: 'Percentage = CGPA × 10',
    toPercent: (c) => c * 10,
    toCgpa: (p) => p / 10,
  },
  custom: {
    id: 'custom',
    label: 'Custom multiplier (from your marks card)',
    note: 'Percentage = CGPA × your multiplier',
    toPercent: (c, f = 10) => c * f,
    toCgpa: (p, f = 10) => p / f,
  },
};

export const MAX_CGPA = 10;

export interface Result {
  ok: boolean;
  value?: number;
  error?: string;
  formulaNote?: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function cgpaToPercent(cgpa: number, id: FormulaId, factor?: number): Result {
  if (!Number.isFinite(cgpa)) return { ok: false, error: 'Enter your CGPA.' };
  if (cgpa < 0 || cgpa > MAX_CGPA) return { ok: false, error: `CGPA must be between 0 and ${MAX_CGPA}.` };
  if (id === 'custom' && (!Number.isFinite(factor!) || factor! <= 0)) {
    return { ok: false, error: 'Enter a multiplier greater than 0.' };
  }
  const f = FORMULAS[id];
  // VTU can go negative below 0.75 CGPA — clamp rather than show a negative percentage.
  const pct = Math.max(0, f.toPercent(cgpa, factor));
  return { ok: true, value: round2(pct), formulaNote: f.note };
}

export function percentToCgpa(percent: number, id: FormulaId, factor?: number): Result {
  if (!Number.isFinite(percent)) return { ok: false, error: 'Enter your percentage.' };
  if (percent < 0 || percent > 100) return { ok: false, error: 'Percentage must be between 0 and 100.' };
  if (id === 'custom' && (!Number.isFinite(factor!) || factor! <= 0)) {
    return { ok: false, error: 'Enter a multiplier greater than 0.' };
  }
  const f = FORMULAS[id];
  const cgpa = Math.min(MAX_CGPA, Math.max(0, f.toCgpa(percent, factor)));
  return { ok: true, value: round2(cgpa), formulaNote: f.note };
}
