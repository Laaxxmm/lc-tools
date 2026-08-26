'use client';

import { useId, useState } from 'react';
import LeadGate from '../../components/LeadGate';
import KpiRow from '../../components/KpiRow';
import {
  LADDER_ACCURACIES,
  MAX_SCORE,
  SECTIONS,
  TIERS,
  TOTAL_QUESTIONS,
  accuracyLadder,
  plan,
  type SectionId,
} from '../../calc/cat-target';

const SLUG = 'cat-percentile-target-calculator';
const CUSTOM = 'custom';

const table = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' } as const;
const th = {
  padding: '0 14px 10px 0',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '.08em',
  whiteSpace: 'nowrap',
} as const;
const td = {
  padding: '12px 14px 12px 0',
  borderTop: '1px solid var(--line)',
  fontSize: 15.5,
  fontWeight: 600,
  whiteSpace: 'nowrap',
} as const;
const scroller = { overflowX: 'auto', margin: '0 -4px', padding: '0 4px' } as const;
const figures = { display: 'flex', flexWrap: 'wrap', gap: 'var(--s5)', alignItems: 'flex-end' } as const;

export default function Calculator() {
  const id = useId();
  const [tierId, setTierId] = useState<string>('iim-abc');
  const [customPercentile, setCustomPercentile] = useState('99');
  const [accuracy, setAccuracy] = useState<Record<SectionId, string>>({
    varc: '75',
    dilr: '65',
    qa: '70',
  });

  const tier = TIERS.find((t) => t.id === tierId);
  const percentile = tier ? tier.percentile : Number(customPercentile);
  const result = plan(percentile, {
    varc: Number(accuracy.varc) / 100,
    dilr: Number(accuracy.dilr) / 100,
    qa: Number(accuracy.qa) / 100,
  });

  return (
    <div style={{ display: 'grid', gap: 'var(--s3)' }}>
      <div className="card">
        <h2>Where do you want to end up?</h2>

        <div className="field" style={{ marginTop: 'var(--s3)' }}>
          <label htmlFor={`${id}-tier`}>Target school tier</label>
          <select id={`${id}-tier`} value={tierId} onChange={(e) => setTierId(e.target.value)}>
            {TIERS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} — around {t.percentile} percentile
              </option>
            ))}
            <option value={CUSTOM}>I have my own target percentile</option>
          </select>
          {tier ? <p className="muted" style={{ marginTop: 8 }}>{tier.schools}</p> : null}
        </div>

        {tier ? null : (
          <div className="field">
            <label htmlFor={`${id}-pct`}>Your target overall percentile</label>
            <input
              id={`${id}-pct`}
              type="number"
              inputMode="decimal"
              min={70}
              max={99.9}
              step={0.1}
              value={customPercentile}
              onChange={(e) => setCustomPercentile(e.target.value)}
            />
          </div>
        )}

        <hr className="rule" style={{ marginTop: 'var(--s4)' }} />
        <h3>Your accuracy, section by section</h3>
        <p className="muted" style={{ marginTop: 6, marginBottom: 'var(--s3)' }}>
          Correct answers divided by attempted questions, from your last three or four full-length
          mocks. This is the assumption everything below rests on, so it is yours to set rather than
          ours to guess.
        </p>

        <div className="grid">
          {SECTIONS.map((s) => (
            <div className="field" key={s.id} style={{ marginBottom: 0 }}>
              <label htmlFor={`${id}-${s.id}`}>
                {s.label} accuracy (%) — {s.questions} questions
              </label>
              <input
                id={`${id}-${s.id}`}
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                step={1}
                value={accuracy[s.id]}
                onChange={(e) => setAccuracy({ ...accuracy, [s.id]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      {!result.ok || !result.sections ? (
        <p className="error" role="alert">{result.error}</p>
      ) : (
        <>
          <div className="card">
            <p className="eyebrow"><span className="dot" />Estimated target</p>
            <KpiRow items={[
              { label: 'Percentile, overall', value: result.percentile },
              { label: `Raw marks, out of ${MAX_SCORE}`, value: `${result.scoreLow}\u2013${result.scoreHigh}` },
              { label: `Questions to attempt, of ${TOTAL_QUESTIONS}`, value: result.totalAttempts },
            ]} />

            <p style={{ marginTop: 'var(--s3)' }}>
              This is an estimate, not a cutoff. The IIMs publish your score and your percentile on
              your own scorecard and nothing else, so the score band above is drawn from what
              candidates have reported after recent results. A harder paper drags every percentile
              down and an easier one lifts it. Plan against the top of the band.
            </p>
            {tier ? (
              <p className="muted">
                Shortlists at this level usually also expect around {tier.sectional} percentile in
                each individual section, not only the overall figure.
              </p>
            ) : null}
          </div>

          <div className="card">
            <h3>The working, so you can check it</h3>
            <p className="muted" style={{ marginTop: 6, marginBottom: 'var(--s3)' }}>
              Each section is given its share of {result.scoreHigh} marks in proportion to the
              questions it holds. You can trade marks between sections, as long as every section
              still clears its own percentile bar.
            </p>

            <div style={scroller}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th} scope="col">Section</th>
                    <th style={th} scope="col">Your accuracy</th>
                    <th style={th} scope="col">Marks per attempt</th>
                    <th style={th} scope="col">Target marks</th>
                    <th style={th} scope="col">Attempts needed</th>
                  </tr>
                </thead>
                <tbody>
                  {result.sections.map((s) => (
                    <tr key={s.id}>
                      <th style={{ ...td, fontWeight: 700 }} scope="row">{s.label}</th>
                      <td style={td}>{Math.round(s.accuracy * 100)}%</td>
                      <td style={td}>
                        3 &times; {s.accuracy.toFixed(2)} &minus; {(1 - s.accuracy).toFixed(2)} ={' '}
                        {s.marksPerAttempt.toFixed(1)}
                      </td>
                      <td style={td}>{s.targetScore.toFixed(1)}</td>
                      <td style={td}>
                        {s.targetScore.toFixed(1)} &divide; {s.marksPerAttempt.toFixed(1)} ={' '}
                        <strong>{s.attempts}</strong> of {s.questions}
                        {s.reachable ? '' : ' — more than the section holds'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="muted" style={{ marginTop: 'var(--s3)' }}>
              A correct answer is worth 3 marks and a wrong MCQ costs 1, so an attempt at accuracy{' '}
              <em>a</em> returns 3<em>a</em> &minus; (1 &minus; <em>a</em>) marks on average. Attempt
              the {result.totalAttempts} questions above at the accuracy you entered and you land on
              about {result.totalNet} marks.
            </p>

            {result.reachable ? null : (
              <p className="error">
                At this accuracy the target needs more questions than the paper contains. Accuracy
                has to move before the plan becomes real.
              </p>
            )}
          </div>

          <LeadGate
            slug={SLUG}
            mode="email"
            heading="See what a change in accuracy does to this plan"
            blurb="Same target, eight accuracy levels, so you can see whether you are short on accuracy or short on speed. Enter your email and it opens straight away."
          >
            <div className="card">
              <h3>The same {result.percentile} percentile target at other accuracies</h3>
              <p className="muted" style={{ marginTop: 6, marginBottom: 'var(--s3)' }}>
                One accuracy applied evenly across all three sections. Read down the column and you
                will see how few extra questions an accuracy gain saves you near the top, and how
                many it saves near the bottom.
              </p>
              <div style={scroller}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={th} scope="col">Accuracy</th>
                      <th style={th} scope="col">Marks per attempt</th>
                      <th style={th} scope="col">Attempts needed</th>
                      <th style={th} scope="col">Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accuracyLadder(result.percentile ?? 0, LADDER_ACCURACIES).map((row, i) => (
                      <tr key={LADDER_ACCURACIES[i]}>
                        <th style={{ ...td, fontWeight: 700 }} scope="row">
                          {Math.round(LADDER_ACCURACIES[i] * 100)}%
                        </th>
                        <td style={td}>{row.sections ? row.sections[0].marksPerAttempt.toFixed(1) : '—'}</td>
                        <td style={td}>{row.totalAttempts ?? '—'} of {TOTAL_QUESTIONS}</td>
                        <td style={td}>
                          {row.reachable ? 'Workable' : 'Not reachable in this paper'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </LeadGate>
        </>
      )}
    </div>
  );
}
