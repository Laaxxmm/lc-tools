'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CATEGORIES, CHANCE_LABEL, NO_CITY, SEATS, categoryCode, citiesFor, predict, summarise,
  type Course, type CutoffData, type Round, type Seat,
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

// Counted from the payload rather than typed into the copy, so the sentence in
// the non-Karnataka panel cannot drift away from what actually shipped.
const NK_COUNTS = (['MBA', 'MCA'] as const).reduce((acc, course) => {
  acc[course] = Object.values(DATA.ranks[course] ?? {})
    .flatMap((progs) => Object.values(progs))
    .filter((cats) => cats.NKN?.r2 != null).length;
  return acc;
}, {} as Record<Course, number>);

const ROUNDS: { id: Round; label: string; note: string }[] = [
  { id: 'r2', label: 'Round 2 — what was still going',
    note: 'Seats that were still being allotted in the second round.' },
  { id: 'r1', label: 'Round 1 — the full picture',
    note: 'Every seat allotted in the first round, including ones that then closed.' },
];

export default function Predictor() {
  const id = useId();
  const [course, setCourse] = useState<Course>('MBA');
  const [rank, setRank] = useState('');
  const [category, setCategory] = useState('GM');
  const [seat, setSeat] = useState<Seat>('rok');
  const [city, setCity] = useState('');
  const [round, setRound] = useState<Round>('r2');
  const [showAll, setShowAll] = useState(false);
  const [pdfState, setPdfState] = useState<'idle' | 'working' | 'failed'>('idle');

  const reset = () => { setShowAll(false); setPdfState('idle'); };
  const code = categoryCode(category, seat);
  const cities = useMemo(() => citiesFor(DATA, course, code, round), [course, code, round]);
  const nonKarnataka = seat === 'nk';
  // The non-Karnataka pool exists in far fewer cities. Changing into it while a
  // city is selected would otherwise leave a filter that quietly returns nothing.
  const liveCity = city && cities.includes(city) ? city : '';

  const parsed = rank.trim() === '' ? NaN : Number(rank);
  const { results, error } = useMemo(
    () => predict({ rank: parsed, category, seat, course, city: liveCity, round, data: DATA }),
    [parsed, category, seat, course, liveCity, round],
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
        year: DATA.year,
        round: ROUNDS.find((r) => r.id === round)?.label.split(' —')[0] ?? 'Round 2',
        counts,
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
          <select id={`${id}-cat`} value={category} disabled={nonKarnataka}
            aria-describedby={nonKarnataka ? `${id}-cat-note` : undefined}
            onChange={(e) => { setCategory(e.target.value); reset(); }}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          {nonKarnataka ? (
            <p className="muted pc-field-note" id={`${id}-cat-note`}>
              Not used for a non-Karnataka candidate — there is one pool.
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor={`${id}-seat`}>Seat type</label>
          <select id={`${id}-seat`} value={seat}
            onChange={(e) => { setSeat(e.target.value as Seat); setCity(''); reset(); }}>
            {SEATS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${id}-round`}>Allotment round</label>
          <select id={`${id}-round`} value={round}
            onChange={(e) => { setRound(e.target.value as Round); setCity(''); reset(); }}>
            {ROUNDS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${id}-city`}>City</label>
          <select id={`${id}-city`} value={liveCity}
            onChange={(e) => { setCity(e.target.value); reset(); }}>
            <option value="">All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </ToolForm>

      {nonKarnataka ? (
        <div className="card pc-nk">
          <p className="eyebrow"><span className="dot" />Non-Karnataka candidate</p>
          <p>
            You are not competing for the government quota. You are competing for seats
            that college managements <strong>surrender back to KEA</strong>, which KEA
            publishes under its NKN column, and those seats appear as the rounds
            progress rather than on day one.
          </p>
          <p className="muted">
            Two things follow, and both are worth knowing before you panic about the
            numbers. The list is genuinely short &mdash; KEA published a non-Karnataka
            closing rank for {NK_COUNTS.MBA} MBA and {NK_COUNTS.MCA} MCA programmes in
            2025, not for hundreds. And your category does not apply: Karnataka&rsquo;s
            reservation does not reach candidates from outside the state, so an SC, ST
            or OBC certificate from your home state does not move these ranks.
          </p>
        </div>
      ) : null}

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
              No {course} programme in KEA&rsquo;s {DATA.year}{' '}
              {round === 'r2' ? 'second' : 'first'}-round table closed at or near rank{' '}
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
                  your rank still reaches. {ROUNDS.find((r) => r.id === round)?.note}
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
                    <span>
                      <span className="pc-y">Round 1</span>{' '}
                      {r.round1 != null
                        ? r.round1.toLocaleString('en-IN')
                        : <span className="muted">none</span>}
                    </span>
                    <span>
                      <span className="pc-y">Round 2</span>{' '}
                      {r.round2 != null
                        ? r.round2.toLocaleString('en-IN')
                        : <span className="muted">nothing left</span>}
                    </span>
                    {r.tightened ? (
                      <span className="pc-tight" title="Round 2 closed at a better rank than round 1">
                        tightened in round 2
                      </span>
                    ) : null}
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
              {DATA.year}, first and second round allotments. An estimate for shortlisting,
              not an allotment. Confirm everything on{' '}
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
