'use client';

import { useEffect, useId, useState, type CSSProperties } from 'react';
import LeadGate from '../../components/LeadGate';
import {
  buildPlan, formatDay, planToText, todayIso,
  CONFIRMED_DATES, EXAM_META, SECTIONS,
  type Exam, type Level, type SectionId, type StudyPlan,
} from '../../calc/study-plan';

const SLUG = 'cat-mat-study-plan-generator';

const DEFAULT_DATE: Record<Exam, string> = { cat: '2026-11-29', mat: '2026-09-13' };

const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: 'fresh', label: 'Starting fresh', hint: 'Topics still missing. You need to build before you can practise.' },
  { id: 'revising', label: 'Revising', hint: 'You have seen the syllabus. Some of it has gone soft.' },
  { id: 'sprint', label: 'Final sprint', hint: 'Syllabus done. Only mocks, timing and error control left.' },
];

// Fills for the time-split bar. Brand tokens only, in the order sections are listed.
const FILLS = ['var(--forest)', 'var(--amber)', 'var(--burnt)', 'var(--teal)', 'var(--muted)'];

const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 'var(--s3)' };
const chip: CSSProperties = {
  display: 'inline-block', padding: '4px 12px', borderRadius: 999,
  border: '1px solid var(--line)', fontSize: 14, fontWeight: 700,
};
const weekBox: CSSProperties = {
  borderTop: '1px solid var(--line)', padding: 'var(--s3) 0',
};
const milestoneBox: CSSProperties = {
  borderLeft: '3px solid var(--amber)', paddingLeft: 'var(--s2)',
  margin: 'var(--s2) 0 0', fontSize: 15, color: 'var(--ink)',
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
      <div className="muted" style={{ fontWeight: 700 }}>{label}</div>
    </div>
  );
}

export default function StudyPlanTool() {
  const id = useId();
  const [exam, setExam] = useState<Exam>('cat');
  const [examDate, setExamDate] = useState(DEFAULT_DATE.cat);
  const [start, setStart] = useState('');
  const [hours, setHours] = useState('3');
  const [level, setLevel] = useState<Level>('fresh');
  const [weakRaw, setWeakRaw] = useState<SectionId>('quant');

  // The page is prerendered, so today cannot be read during render without a
  // hydration mismatch. One tick after mount the plan appears.
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
  const official = CONFIRMED_DATES.find((d) => d.exam === exam && d.date === examDate);

  function download() {
    if (!plan) return;
    const blob = new Blob([planToText(plan)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam}-study-plan-${examDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="card">
        <h2>Build your plan</h2>
        <p className="muted" style={{ marginBottom: 'var(--s4)' }}>
          Nothing here is stored until you ask for the download. Change any answer and the plan
          rebuilds as you type.
        </p>

        <div style={{ display: 'grid', gap: 'var(--s3)', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor={`${id}-exam`}>Which exam</label>
            <select id={`${id}-exam`} value={exam} onChange={(e) => pickExam(e.target.value as Exam)}>
              <option value="cat">CAT 2026</option>
              <option value="mat">MAT 2026</option>
            </select>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor={`${id}-date`}>Exam date</label>
            <input
              id={`${id}-date`} type="date" value={examDate}
              min={start || undefined}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor={`${id}-hours`}>Hours you can study a day</label>
            <input
              id={`${id}-hours`} type="number" inputMode="decimal"
              min={0.5} max={14} step={0.5} value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor={`${id}-level`}>Where you are now</label>
            <select id={`${id}-level`} value={level} onChange={(e) => setLevel(e.target.value as Level)}>
              {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor={`${id}-weak`}>Weakest section</label>
            <select id={`${id}-weak`} value={weakest} onChange={(e) => setWeakRaw(e.target.value as SectionId)}>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor={`${id}-start`}>Start the plan on</label>
            <input
              id={`${id}-start`} type="date" value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
        </div>

        <p className="muted" style={{ marginTop: 'var(--s3)' }}>
          {official
            ? `${official.label} — published by the exam body.`
            : 'You set this date yourself, so we have not checked it. Confirm it on the official site before you plan around it.'}
          {' '}{LEVELS.find((l) => l.id === level)?.hint}
        </p>
      </div>

      {result && !result.ok ? (
        <p className="error" role="alert" style={{ marginTop: 'var(--s3)', fontSize: 16 }}>{result.error}</p>
      ) : null}

      {plan ? (
        <div style={{ marginTop: 'var(--s5)' }}>
          <hr className="rule" />
          <h2>{plan.headline}</h2>
          <p style={{ maxWidth: '62ch' }}>{plan.shapeNote}</p>
          <p className="muted" style={{ maxWidth: '62ch' }}>
            This is a plan, not a prediction. It allocates the time you told us you have; it cannot
            tell you what you will score, and no tool honestly can.
          </p>

          <div style={{ ...row, gap: 'var(--s5)', margin: 'var(--s4) 0' }}>
            <Stat value={String(plan.daysLeft)} label="days left" />
            <Stat value={String(plan.weeks.length)} label={plan.weeks.length === 1 ? 'week' : 'weeks'} />
            <Stat value={`${plan.totalHours}h`} label="study hours" />
            <Stat value={String(plan.totalMocks)} label="full mocks" />
          </div>

          <h3>Where the time goes</h3>
          <div aria-hidden="true" style={{ display: 'flex', height: 14, borderRadius: 999, overflow: 'hidden', margin: '10px 0 14px' }}>
            {plan.split.map((s, i) => (
              <div key={s.id} style={{ width: `${s.share * 100}%`, background: FILLS[i % FILLS.length] }} />
            ))}
          </div>
          <ul style={{ ...row, listStyle: 'none', margin: 0, padding: 0, gap: 'var(--s2)' }}>
            {plan.split.map((s, i) => (
              <li key={s.id} style={chip}>
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block', width: 9, height: 9, borderRadius: 2,
                    background: FILLS[i % FILLS.length], marginRight: 8,
                  }}
                />
                {s.label} — {Math.round(s.share * 100)}%, about {s.hours}h
              </li>
            ))}
          </ul>

          {plan.flags.length ? (
            <div style={{ marginTop: 'var(--s4)' }}>
              <h3>Read this before you start</h3>
              {plan.flags.map((f) => <p key={f} style={{ maxWidth: '64ch', fontSize: 16 }}>{f}</p>)}
            </div>
          ) : null}

          <h3 style={{ marginTop: 'var(--s5)' }}>Week by week</h3>
          <p className="muted">
            One rest day a week is already taken out of every total. {EXAM_META[plan.exam].paper}
          </p>

          <ol style={{ listStyle: 'none', margin: 'var(--s3) 0 0', padding: 0 }}>
            {plan.weeks.map((w) => (
              <li key={w.week} style={weekBox}>
                <div style={{ ...row, alignItems: 'baseline', gap: 'var(--s2)' }}>
                  <strong style={{ fontWeight: 800, fontSize: 18 }}>Week {w.week}</strong>
                  <span className="muted">{formatDay(w.from)} to {formatDay(w.to)}</span>
                  <span className="eyebrow">{w.phaseLabel}</span>
                </div>
                <p className="muted" style={{ margin: '6px 0 0', fontWeight: 700 }}>
                  {w.hours}h available · {w.mocks} full mock{w.mocks === 1 ? '' : 's'} ({w.mockHours}h)
                  {' · '}{w.drillHours}h drilling
                </p>
                <p style={{ maxWidth: '64ch', fontSize: 16 }}>{w.focus}</p>
                <ul style={{ ...row, listStyle: 'none', margin: 0, padding: 0, gap: 8 }}>
                  {w.split.map((s) => (
                    <li key={s.id} style={chip}>{s.short} {s.hours}h</li>
                  ))}
                </ul>
                {w.milestone ? <p style={milestoneBox}>{w.milestone}</p> : null}
              </li>
            ))}
          </ol>

          <div style={{ marginTop: 'var(--s5)' }}>
            <hr className="rule" />
            <LeadGate
              slug={SLUG}
              mode="email+phone"
              heading="Keep a copy of this plan"
              blurb="The whole plan is already on this page. The download is a text file you can paste into your notes app, print, or stick above your desk."
            >
              <div className="card">
                <h3>Your plan is ready to download</h3>
                <p className="muted">
                  Every week, split and checkpoint above, in one file. Regenerate and download again
                  any time your dates or hours change.
                </p>
                <button className="btn btn-forest" type="button" onClick={download}>
                  Download the plan
                </button>
              </div>
            </LeadGate>
          </div>
        </div>
      ) : null}
    </>
  );
}
