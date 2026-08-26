'use client';

import { useId, useState } from 'react';
import {
  CATEGORIES,
  STREAMS,
  checkEligibility,
  type Category,
  type Stream,
  type Verdict,
} from '../../calc/eligibility';
import { FORMULAS, type FormulaId } from '../../calc/cgpa';
import KpiRow from '../../components/KpiRow';

// No submit button. The verdicts recompute as you change a field, because the
// interesting part of this tool is watching one input flip six answers at once.

const VERDICT_LABEL: Record<Verdict, string> = {
  eligible: 'Eligible',
  depends: 'Conditional',
  'not-eligible': 'Not eligible',
};

const VERDICT_CLASS: Record<Verdict, string> = {
  eligible: 'el-yes',
  depends: 'el-maybe',
  'not-eligible': 'el-no',
};

// Direct 10x leads: it is what the IIMs fall back to when a university confirms
// it has no conversion scheme of its own.
const FORMULA_ORDER: FormulaId[] = ['direct10', 'vtu', 'ugc95', 'anna', 'custom'];

function parse(v: string): number {
  return v.trim() === '' ? NaN : Number(v);
}

export default function Checker() {
  const id = useId();
  const [stream, setStream] = useState<Stream>('engineering');
  const [category, setCategory] = useState<Category>('general');
  const [finalYear, setFinalYear] = useState(false);
  const [hadMaths, setHadMaths] = useState(true);
  const [marksMode, setMarksMode] = useState<'percent' | 'cgpa'>('percent');
  const [marks, setMarks] = useState('62');
  const [formula, setFormula] = useState<FormulaId>('direct10');
  const [factor, setFactor] = useState('9.5');
  const [work, setWork] = useState('0');

  const result = checkEligibility({
    stream,
    category,
    finalYear,
    hadMaths,
    workMonths: work.trim() === '' ? 0 : Number(work),
    marksMode,
    marks: parse(marks),
    formula,
    factor: parse(factor),
  });

  const exams = result.exams ?? [];
  const clear = result.clear ?? 0;
  const conditional = exams.filter((e) => e.verdict === 'depends').length;

  return (
    <div>
      <p className="eyebrow"><span className="dot" />Ten exams, one form</p>
      <h2>Tell it five things about your degree</h2>
      <p className="el-standfirst">
        Every answer below names the rule that produced it and links the exam body&rsquo;s own
        page. Nothing here is gated, and nothing is guessed: where an exam publishes no
        percentage bar, you get told that instead of a number we made up.
      </p>

      {/* Same card + three-column grid as every other tool. */}
      <div className="tool-inputs">
        <div className="field-grid">
        <div className="field">
          <label htmlFor={`${id}-stream`}>Your degree</label>
          <select
            id={`${id}-stream`}
            value={stream}
            onChange={(e) => setStream(e.target.value as Stream)}
          >
            {STREAMS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${id}-category`}>Category</label>
          <select
            id={`${id}-category`}
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${id}-mode`}>Marks you are entering</label>
          <select
            id={`${id}-mode`}
            value={marksMode}
            onChange={(e) => setMarksMode(e.target.value as 'percent' | 'cgpa')}
          >
            <option value="percent">Percentage</option>
            <option value="cgpa">CGPA</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${id}-marks`}>
            {marksMode === 'percent' ? 'Graduation percentage' : 'Graduation CGPA'}
          </label>
          <input
            id={`${id}-marks`}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            max={marksMode === 'percent' ? 100 : 10}
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
          />
        </div>

        {marksMode === 'cgpa' ? (
          <div className="field">
            <label htmlFor={`${id}-formula`}>Your university&rsquo;s conversion</label>
            <select
              id={`${id}-formula`}
              value={formula}
              onChange={(e) => setFormula(e.target.value as FormulaId)}
            >
              {FORMULA_ORDER.map((f) => (
                <option key={f} value={f}>{FORMULAS[f].label}</option>
              ))}
            </select>
          </div>
        ) : null}

        {marksMode === 'cgpa' && formula === 'custom' ? (
          <div className="field">
            <label htmlFor={`${id}-factor`}>Multiplier from your marks card</label>
            <input
              id={`${id}-factor`}
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0.1"
              value={factor}
              onChange={(e) => setFactor(e.target.value)}
            />
          </div>
        ) : null}

        <div className="field">
          <label htmlFor={`${id}-work`}>Work experience (months)</label>
          <input
            id={`${id}-work`}
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            value={work}
            onChange={(e) => setWork(e.target.value)}
          />
        </div>
        </div>

        <div className="el-checks">
        <label className="consent" htmlFor={`${id}-final`}>
          <input
            id={`${id}-final`}
            type="checkbox"
            checked={finalYear}
            onChange={(e) => setFinalYear(e.target.checked)}
          />
          <span>I am still in my final year and my aggregate is not final yet</span>
        </label>

        <label className="consent" htmlFor={`${id}-maths`}>
          <input
            id={`${id}-maths`}
            type="checkbox"
            checked={hadMaths}
            onChange={(e) => setHadMaths(e.target.checked)}
          />
          <span>I studied Mathematics or Statistics at 10+2 or in my degree</span>
        </label>
        </div>
      </div>

      {!result.ok ? (
        <p className="error" role="alert">{result.error}</p>
      ) : (
        <div className="el-out">
          {/* The answer, before any scrolling. */}
          <KpiRow items={[
            { label: 'Exams checked', value: exams.length },
            { label: 'You clear outright', value: clear },
            { label: 'Depends on one more thing', value: conditional },
          ]} />
          <p className="el-summary" aria-live="polite">
            Working from {result.percent}% aggregate. You clear the published bar outright for{' '}
            {clear} of {exams.length}.{' '}
            {conditional > 0
              ? `${conditional} more turn on something this page cannot decide for you, and each one says what.`
              : ''}
          </p>

          <ol className="el-list">
            {exams.map((e) => (
              <li className="card el-row" key={e.id}>
                <div className="el-head">
                  <h3>{e.exam}</h3>
                  <span className={`el-tag ${VERDICT_CLASS[e.verdict]}`}>
                    {VERDICT_LABEL[e.verdict]}
                  </span>
                </div>
                <p className="el-detail">{e.detail}</p>
                <p className="el-rule"><span className="el-k">The rule:</span> {e.rule}</p>
                <p className="el-note">
                  <a className="el-src" href={e.source.href} rel="noopener">
                    Read it on {e.source.label}
                  </a>
                </p>
              </li>
            ))}
          </ol>

          <div className="el-foot">
            {result.finalYearNote ? <p className="el-note">{result.finalYearNote}</p> : null}
            {result.streamNote ? <p className="el-note">{result.streamNote}</p> : null}
            <p className="el-note">{result.workNote}</p>
            <p className="el-note">
              These are the exam bodies&rsquo; rules for writing the test. The institute you
              apply to afterwards can ask for more, and several do. Read the notification for
              the exam you are registering for before you pay the fee.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
