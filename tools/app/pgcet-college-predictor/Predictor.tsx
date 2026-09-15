'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CATEGORIES, CHANCE_LABEL, NO_CITY, SEATS, citiesFor, predict, summarise,
  type Course, type CutoffData, type Seat,
} from '../../calc/pgcet-predictor.ts';
import raw from '../../data/pgcet-cutoffs.json' with { type: 'json' };
import KpiRow from '../../components/KpiRow';
import ToolForm from '../../components/ToolForm';

const DATA = raw as unknown as CutoffData;

// A strong rank clears most of the state, so the raw list runs past three hundred
// rows. Showing that wall helps nobody. The sort already puts the most selective
// reachable programme first, which is the end a student is choosing from, so the
// first page is the useful one -- and the PDF carries every row regardless.
const PAGE = 40;

export default function Predictor() {
  const id = useId();
  const [course, setCourse] = useState<Course>('MBA');
  const [rank, setRank] = useState('');
  const [category, setCategory] = useState('GM');
  const [seat, setSeat] = useState<Seat>('rok');
  const [city, setCity] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [pdfState, setPdfState] = useState<'idle' | 'working' | 'failed'>('idle');

  const reset = () => { setShowAll(false); setPdfState('idle'); };
  const cities = useMemo(() => citiesFor(DATA, course), [course]);

  const parsed = rank.trim() === '' ? NaN : Number(rank);
  const { results, error } = useMemo(
    () => predict({ rank: parsed, category, seat, course, city, data: DATA }),
    [parsed, category, seat, course, city],
  );

  const counts = summarise(results);
  const shown = showAll ? results : results.slice(0, PAGE);
  const showError = rank.trim() !== '' && error;
  const asked = rank.trim() !== '' && !error;
  const catLabel = CATEGORIES.find((c) => c.id === category)?.label ?? category;
  const seatLabel = SEATS.find((s) => s.id === seat)?.label ?? '';

  async function onDownload() {
    setPdfState('working');
    try {
      const { downloadPredictionPdf } = await import('../../lib/predictor-pdf.ts');
      await downloadPredictionPdf(results, {
        rank: parsed, course, category: catLabel, seat: seatLabel, city,
        year: DATA.year, round: DATA.round, counts,
      });
      setPdfState('idle');
    } catch {
      // The library is fetched on click, so a flaky connection is the likely
      // cause. Say so rather than leaving a button that looks broken.
      setPdfState('failed');
    }
  }

  return (
    <>
      <ToolForm title="Your PGCET rank">
        <div className="field">
          <label htmlFor={`${id}-course`}>Course</label>
          <select id={`${id}-course`} value={course}
            onChange={(e) => { setCourse(e.target.value as Course); setCity(''); reset(); }}>
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
            onChange={(e) => { setRank(e.target.value); reset(); }}
          />
        </div>

        <div className="field">
          <label htmlFor={`${id}-cat`}>Category</label>
          <select id={`${id}-cat`} value={category}
            onChange={(e) => { setCategory(e.target.value); reset(); }}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${id}-seat`}>Seat type</label>
          <select id={`${id}-seat`} value={seat}
            onChange={(e) => { setSeat(e.target.value as Seat); reset(); }}>
            {SEATS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${id}-city`}>City</label>
          <select id={`${id}-city`} value={city}
            onChange={(e) => { setCity(e.target.value); reset(); }}>
            <option value="">All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
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
              No {course} programme in KEA&rsquo;s {DATA.year} tables closed at or near rank{' '}
              <strong>{parsed.toLocaleString('en-IN')}</strong> for {catLabel} on the{' '}
              {seatLabel} list{city ? <> in <strong>{city}</strong></> : null}.
            </p>
            <p className="muted">
              {city
                ? 'Try All cities first — a city filter on top of a tight rank narrows the list fast.'
                : 'Either the rank sits past every published closing rank for this category, or this category had no allotments on this seat type. Try the other seat type, or check the category on your certificate.'}
            </p>
          </div>
        ) : (
          <>
            <KpiRow items={[
              { label: 'Programmes in reach', value: results.length.toLocaleString('en-IN'),
                note: `${course} · ${catLabel}${city ? ` · ${city}` : ''}` },
              { label: CHANCE_LABEL.safe, value: counts.safe, note: 'Comfortably inside' },
              { label: CHANCE_LABEL.moderate, value: counts.moderate, note: 'Inside, but close' },
              { label: CHANCE_LABEL.reach, value: counts.reach, note: 'Just past it' },
            ]} />

            <div className="pc-bar">
              <div>
                <h2 className="pc-h">
                  {results.length.toLocaleString('en-IN')} programmes for rank{' '}
                  {parsed.toLocaleString('en-IN')}
                </h2>
                <p className="muted pc-lede">
                  Most selective first, so the top of this list is the most competitive seat
                  your rank still reaches.
                </p>
              </div>
              <div className="pc-dl">
                <button type="button" className="btn btn-primary" onClick={onDownload}
                  disabled={pdfState === 'working'}>
                  {pdfState === 'working' ? 'Building PDF…' : 'Download all as PDF'}
                </button>
                <p className="muted pc-dl-note">
                  {pdfState === 'failed'
                    ? 'Could not build the PDF. Check your connection and try again.'
                    : `All ${results.length.toLocaleString('en-IN')} rows, ready for option entry.`}
                </p>
              </div>
            </div>

            <ul className="pc-list">
              {shown.map((r) => (
                <li className={`card pc-row pc-${r.chance}`} key={`${r.collegeCode}-${r.programme}`}>
                  <div className="pc-head">
                    <p className="pc-name">{r.collegeName}</p>
                    <span className={`pc-tag pc-tag-${r.chance}`}>{CHANCE_LABEL[r.chance]}</span>
                  </div>
                  <p className="pc-prog">
                    {r.programme}
                    <span className="pc-college-code">{r.collegeCode}</span>
                    {r.city ? <span className="pc-city">{r.city}</span> : null}
                  </p>
                  <p className="pc-years">
                    <span><span className="pc-y">Closed at</span>{' '}
                      {r.closingRank.toLocaleString('en-IN')}</span>
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
              {DATA.year}, {DATA.round.toLowerCase()}. An estimate for shortlisting, not an
              allotment. Confirm everything on{' '}
              <a href="https://cetonline.karnataka.gov.in/kea/">KEA&rsquo;s own site</a>.
              {cities.includes(NO_CITY) ? (
                <> KEA does not publish a district column, so a college whose city its text
                  never states is listed under &ldquo;{NO_CITY}&rdquo; rather than guessed at.</>
              ) : null}
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
