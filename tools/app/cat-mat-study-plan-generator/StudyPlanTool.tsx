'use client';

import { useEffect, useId, useState } from 'react';
import LeadGate from '../../components/LeadGate';
import Icon from '../../components/Icon';
import { downloadPlanPdf } from '../../lib/plan-pdf';
import {
  buildPlan, formatDay, todayIso,
  CONFIRMED_DATES, SECTIONS,
  type Exam, type Level, type SectionId, type StudyPlan,
} from '../../calc/study-plan';

const SLUG = 'cat-mat-study-plan-generator';
const DEFAULT_DATE: Record<Exam, string> = { cat: '2026-11-29', mat: '2026-09-13' };

const LEVELS: { id: Level; label: string }[] = [
  { id: 'fresh', label: 'Starting fresh' },
  { id: 'revising', label: 'Revising' },
  { id: 'sprint', label: 'Final sprint' },
];

const FILLS = ['var(--forest)', 'var(--amber)', 'var(--burnt)', 'var(--teal)', 'var(--muted)'];

export default function StudyPlanTool() {
  const id = useId();
  const [exam, setExam] = useState<Exam>('cat');
  const [examDate, setExamDate] = useState(DEFAULT_DATE.cat);
  const [start, setStart] = useState('');
  const [hours, setHours] = useState('3');
  const [level, setLevel] = useState<Level>('fresh');
  const [weakRaw, setWeakRaw] = useState<SectionId>('quant');
  const [busy, setBusy] = useState(false);

  // Prerendered page: reading today during render would mismatch on hydration.
  useEffect(() => setStart(todayIso(new Date())), []);

  const sections = SECTIONS[exam];
  const weakest = sections.some((s) => s.id === weakRaw) ? weakRaw : sections[0].id;

  function pickExam(next: Exam) {
    setExam(next);
    setExamDate(DEFAULT_DATE[next]);
    setWeakRaw(SECTIONS[next][0].id);
  }

  const result = start
    ? buildPlan({ exam, start, examDate, hoursPerDay: Number(hours), level, weakest })
    : null;
  const plan: StudyPlan | null = result?.ok ? result : null;
  const error = result && !result.ok ? result.error : null;
  const official = CONFIRMED_DATES.find((d) => d.exam === exam && d.date === examDate);

  async function getPdf() {
    if (!plan || busy) return;
    setBusy(true);
    try {
      await downloadPlanPdf(plan);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Set-once controls, laid out across the width. */}
      <section className="tool-inputs" aria-label="Your details">
        <h2>Your details</h2>
        <div className="field-grid">

        <div className="field">
          <label htmlFor={`${id}-exam`}>Which exam</label>
          <select id={`${id}-exam`} value={exam} onChange={(e) => pickExam(e.target.value as Exam)}>
            <option value="cat">CAT 2026</option>
            <option value="mat">MAT 2026</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${id}-date`}>Exam date</label>
          <input id={`${id}-date`} type="date" value={examDate} min={start || undefined}
                 onChange={(e) => setExamDate(e.target.value)} />
          <span className="field-note">
            {official ? 'Confirmed by the exam body' : 'Expected date — check the official site'}
          </span>
        </div>

        <div className="field">
          <label htmlFor={`${id}-hours`}>Hours a day</label>
          <input id={`${id}-hours`} type="number" inputMode="decimal" min={0.5} max={14} step={0.5}
                 value={hours} onChange={(e) => setHours(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor={`${id}-level`}>Where you are now</label>
          <select id={`${id}-level`} value={level} onChange={(e) => setLevel(e.target.value as Level)}>
            {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${id}-weak`}>Weakest section</label>
          <select id={`${id}-weak`} value={weakest} onChange={(e) => setWeakRaw(e.target.value as SectionId)}>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${id}-start`}>Start on</label>
          <input id={`${id}-start`} type="date" value={start}
                 onChange={(e) => setStart(e.target.value)} />
        </div>

        </div>
      </section>

      <div className="tool-layout">
        <aside className="pane">
          <LeadGate
            slug={SLUG}
            mode="email+phone"
            trigger="Download the full plan (PDF)"
            heading="Where should we send it?"
            submitLabel="Get my plan"
          >
            <button className="btn btn-primary btn-block" type="button" onClick={getPdf} disabled={!plan || busy}>
              <Icon name="download" size={17} />
              {busy ? 'Building your PDF…' : 'Download the plan'}
            </button>
          </LeadGate>
        </aside>

        {/* Output. Summary only — the week-by-week narrative lives in the PDF. */}
        <div className="output">
        {error ? <p className="error" role="alert">{error}</p> : null}

        {plan ? (
          <>
            <div className="kpi-row">
              <div className="kpi"><p className="k">Days left</p><p className="n">{plan.daysLeft}</p></div>
              <div className="kpi"><p className="k">{plan.weeks.length === 1 ? 'Week' : 'Weeks'}</p><p className="n">{plan.weeks.length}</p></div>
              <div className="kpi"><p className="k">Study hours</p><p className="n">{plan.totalHours}h</p></div>
              <div className="kpi"><p className="k">Full mocks</p><p className="n">{plan.totalMocks}</p></div>
            </div>

            <p className="muted" style={{ marginTop: 0 }}>{plan.shapeNote}</p>

            <h3 style={{ marginTop: 'var(--s4)' }}>Where the time goes</h3>
            <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', margin: 'var(--s2) 0' }} aria-hidden="true">
              {plan.split.map((s, i) => (
                <div key={s.id} style={{ width: `${s.share * 100}%`, background: FILLS[i % FILLS.length] }} />
              ))}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: 'var(--s2)' }}>
              {plan.split.map((s) => (
                <li key={s.id} className="muted" style={{ fontSize: 13.5, fontWeight: 600 }}>
                  {s.label} — {Math.round(s.share * 100)}%, about {s.hours}h
                </li>
              ))}
            </ul>

            <h3 style={{ marginTop: 'var(--s4)' }}>Your {plan.weeks.length} weeks</h3>
            <div className="plan-table-wrap">
              <table className="plan">
                <thead>
                  <tr>
                    <th>Week</th><th>Dates</th><th>Phase</th>
                    <th>Hours</th><th>Mocks</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.weeks.map((w) => (
                    <tr key={w.week}>
                      <td className="num"><strong>{w.week}</strong></td>
                      <td className="num">{formatDay(w.from)} – {formatDay(w.to)}</td>
                      <td>
                        <span className={`phase-pill ${w.phase === 'taper' ? 'phase-taper' : ''}`}>
                          {w.phaseLabel}
                        </span>
                      </td>
                      <td className="num">{w.hours}h</td>
                      <td className="num">{w.mocks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ fontSize: 13.5 }}>
              What to actually do each week — the focus, the section split and the checkpoints — is
              in the PDF.
            </p>
          </>
        ) : (
          <p className="muted">Building your plan…</p>
          )}
        </div>
      </div>
    </>
  );
}
