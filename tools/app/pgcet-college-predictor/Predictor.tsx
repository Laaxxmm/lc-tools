'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CATEGORIES, CHANCE_LABEL, SEATS, predict, summarise,
  type Course, type CutoffData, type Seat,
} from '../../calc/pgcet-predictor.ts';
import raw from '../../data/pgcet-cutoffs.json' with { type: 'json' };
import KpiRow from '../../components/KpiRow';
import ToolForm from '../../components/ToolForm';

const DATA = raw as unknown as CutoffData;

// A strong rank clears nearly every programme in the state, so the raw list runs
// past three hundred rows. Showing that wall helps nobody. The sort already puts
// the most selective reachable programme first, which is the end a student is
// actually choosing from, so the first page is the useful one.
const PAGE = 40;

export default function Predictor() {
  const id = useId();
  const [course, setCourse] = useState<Course>('MBA');
  const [rank, setRank] = useState('');
  const [category, setCategory] = useState('GM');
  const [seat, setSeat] = useState<Seat>('rok');
  const [showAll, setShowAll] = useState(false);

  const parsed = rank.trim() === '' ? NaN : Number(rank);
  const { results, error } = useMemo(
    () => predict({ rank: parsed, category, seat, course, data: DATA }),
    [parsed, category, seat, course],
  );

  const counts = summarise(results);
  const shown = showAll ? results : results.slice(0, PAGE);
  // An empty box is a student who has not typed yet, not a student who is wrong.
  const showError = rank.trim() !== '' && error;
  const asked = rank.trim() !== '' && !error;

  return (
    <>
      <ToolForm title="Your PGCET rank">
        <div className="field">
          <label htmlFor={`${id}-course`}>Course</label>
          <select id={`${id}-course`} value={course}
            onChange={(e) => { setCourse(e.target.value as Course); setShowAll(false); }}>
            <option value="MBA">MBA</option>
            <option value="MCA">MCA</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${id}-rank`}>Your PGCET rank</label>
          <input
            id={`${id}-rank`} type="number" inputMode="numeric"
            min={1} step={1} placeholder="e.g. 4200"
            value={rank}
            onChange={(e) => { setRank(e.target.value); setShowAll(false); }}
          />
        </div>

        <div className="field">
          <label htmlFor={`${id}-cat`}>Category</label>
          <select id={`${id}-cat`} value={category}
            onChange={(e) => { setCategory(e.target.value); setShowAll(false); }}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${id}-seat`}>Seat type</label>
          <select id={`${id}-seat`} value={seat}
            onChange={(e) => { setSeat(e.target.value as Seat); setShowAll(false); }}>
            {SEATS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </ToolForm>

      {showError ? <p className="error" role="alert">{error}</p> : null}

      <div aria-live="polite">
        {!asked ? (
          <p className="muted pc-hint">
            Type your rank above. Don&rsquo;t know it yet?{' '}
            <a href="https://learncrew.org/pgcet-rank-college-predictor/">
              Estimate it from your marks
            </a>{' '}
            first, then come back with the number.
          </p>
        ) : results.length === 0 ? (
          <div className="card pc-empty">
            <p className="eyebrow"><span className="dot" />No match</p>
            <p>
              No {course} programme in KEA&rsquo;s 2023 or 2024 tables closed at or near rank{' '}
              <strong>{parsed.toLocaleString('en-IN')}</strong> for{' '}
              {CATEGORIES.find((c) => c.id === category)?.label} on the{' '}
              {SEATS.find((s) => s.id === seat)?.label} list.
            </p>
            <p className="muted">
              Two things usually explain that. The rank may sit past every published closing
              rank for this category, which in MBA ran to about 43,000. Or this category
              simply had no allotments on this seat type — several combinations have very few.
              Try the other seat type, or check the category on your certificate.
            </p>
          </div>
        ) : (
          <>
            <KpiRow items={[
              { label: 'Programmes in reach', value: results.length.toLocaleString('en-IN'),
                note: `${course} · ${CATEGORIES.find((c) => c.id === category)?.label}` },
              { label: CHANCE_LABEL.safe, value: counts.safe,
                note: 'Ahead of both years’ closing ranks' },
              { label: CHANCE_LABEL.moderate, value: counts.moderate,
                note: 'Inside the easier year only' },
              { label: CHANCE_LABEL.reach, value: counts.reach,
                note: 'Just past the easier year' },
            ]} />

            <h2 className="pc-h">
              {results.length.toLocaleString('en-IN')} programmes for rank{' '}
              {parsed.toLocaleString('en-IN')}
            </h2>
            <p className="muted pc-lede">
              Most selective first, so the top of this list is the most competitive seat your
              rank still reaches. Both years are printed for every row — the gap between them
              is how much that boundary moves.
            </p>

            <ul className="pc-list">
              {shown.map((r) => (
                <li className={`card pc-row pc-${r.chance}`} key={`${r.collegeCode}-${r.programmeCode}`}>
                  <div className="pc-head">
                    <p className="pc-name">{r.collegeName}</p>
                    <span className={`pc-tag pc-tag-${r.chance}`}>{CHANCE_LABEL[r.chance]}</span>
                  </div>
                  <p className="pc-prog">
                    {r.programmeName}
                    {r.programmeCode ? <span className="pc-code">{r.programmeCode}</span> : null}
                    <span className="pc-college-code">{r.collegeCode}</span>
                  </p>
                  <p className="pc-years">
                    {DATA.years.map((y) => (
                      <span key={y}>
                        <span className="pc-y">{y}</span>{' '}
                        {r.closingByYear[y] != null
                          ? r.closingByYear[y].toLocaleString('en-IN')
                          : <span className="muted">not published</span>}
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ul>

            {results.length > PAGE && !showAll ? (
              <p className="pc-more">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAll(true)}>
                  Show the remaining {(results.length - PAGE).toLocaleString('en-IN')}
                </button>
              </p>
            ) : null}

            <p className="muted pc-src">
              Closing ranks as published by the Karnataka Examinations Authority for PGCET{' '}
              {DATA.years.join(' and ')}. An estimate for shortlisting, not an allotment.
              Confirm everything on{' '}
              <a href="https://cetonline.karnataka.gov.in/kea/">KEA&rsquo;s own site</a>.
            </p>
          </>
        )}
      </div>

      <p className="muted pc-cross">
        Working out whether you qualify at all?{' '}
        <Link href="/mba-exam-eligibility-checker/">Check PGCET eligibility</Link>.
      </p>
    </>
  );
}
