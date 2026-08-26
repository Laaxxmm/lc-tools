'use client';

import { useId, useState } from 'react';
import { FORMULAS, MAX_CGPA, cgpaToPercent, percentToCgpa, type FormulaId } from '../../calc/cgpa';
import KpiRow from '../../components/KpiRow';

// Two boxes, no submit button and no direction toggle. Whichever box you type in
// is the source; the other one is derived. The maths lives in calc/cgpa.ts.
type Source = { from: 'cgpa' | 'percent'; value: string };

const ORDER: FormulaId[] = ['vtu', 'ugc95', 'direct10', 'anna', 'custom'];

function parse(v: string): number {
  return v.trim() === '' ? NaN : Number(v);
}

export default function Converter() {
  const id = useId();
  const [src, setSrc] = useState<Source>({ from: 'cgpa', value: '8.24' });
  const [formula, setFormula] = useState<FormulaId>('vtu');
  const [factor, setFactor] = useState('9.5');

  const f = parse(factor);
  const typed = parse(src.value);
  const result = src.from === 'cgpa'
    ? cgpaToPercent(typed, formula, f)
    : percentToCgpa(typed, formula, f);

  const shown = result.ok ? String(result.value) : '';
  const cgpa = src.from === 'cgpa' ? src.value : shown;
  const percent = src.from === 'percent' ? src.value : shown;

  // An empty box is not a mistake, so it gets no red text.
  const error = src.value.trim() !== '' && !result.ok ? result.error : '';

  const cgpaForCompare = parse(cgpa);
  const comparable = Number.isFinite(cgpaForCompare)
    && cgpaForCompare >= 0 && cgpaForCompare <= MAX_CGPA;

  return (
    <>
      <div className="card">
        <div className="grid">
          <div className="field">
            <label htmlFor={`${id}-cgpa`}>Your CGPA (out of {MAX_CGPA})</label>
            <input
              id={`${id}-cgpa`} type="number" inputMode="decimal"
              min={0} max={MAX_CGPA} step="0.01" placeholder="8.24"
              value={cgpa}
              onChange={(e) => setSrc({ from: 'cgpa', value: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor={`${id}-pct`}>Your percentage</label>
            <input
              id={`${id}-pct`} type="number" inputMode="decimal"
              min={0} max={100} step="0.01" placeholder="74.9"
              value={percent}
              onChange={(e) => setSrc({ from: 'percent', value: e.target.value })}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor={`${id}-formula`}>Which formula does your university use?</label>
          <select
            id={`${id}-formula`}
            value={formula}
            onChange={(e) => setFormula(e.target.value as FormulaId)}
          >
            {ORDER.map((k) => (
              <option key={k} value={k}>{FORMULAS[k].label}</option>
            ))}
          </select>
        </div>

        {formula === 'custom' ? (
          <div className="field">
            <label htmlFor={`${id}-factor`}>Multiplier printed on your marks card</label>
            <input
              id={`${id}-factor`} type="number" inputMode="decimal"
              min={0} step="0.1" placeholder="9.5"
              value={factor}
              onChange={(e) => setFactor(e.target.value)}
            />
          </div>
        ) : null}

        {error ? <p className="error" role="alert">{error}</p> : null}

        <div aria-live="polite">
          <p className="eyebrow"><span className="dot" />
            {src.from === 'cgpa' ? 'Your percentage' : 'Your CGPA'}
          </p>
          <p className="price">
            {result.ok
              ? (src.from === 'cgpa' ? `${result.value}%` : `${result.value} CGPA`)
              : '—'}
          </p>
          <p className="muted">
            {FORMULAS[formula].label}. {FORMULAS[formula].note}
            {formula === 'custom' && Number.isFinite(f) ? ` (multiplier ${f})` : ''}
          </p>
        </div>
      </div>

      {comparable ? (
        <>
          <h2 style={{ marginTop: 'var(--s6)' }}>
            A CGPA of {cgpaForCompare} under each formula
          </h2>
          <p className="muted">
            Same grade point, five different percentages. This spread is the reason picking
            the wrong formula quietly costs or gains you marks on an application form.
          </p>
          <KpiRow
            items={ORDER.map((k) => {
              const r = cgpaToPercent(cgpaForCompare, k, f);
              return {
                label: FORMULAS[k].label,
                value: r.ok ? `${r.value}%` : '\u2014',
                note: FORMULAS[k].note,
              };
            })}
          />
        </>
      ) : null}
    </>
  );
}
