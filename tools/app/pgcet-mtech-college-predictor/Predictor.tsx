'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CATEGORIES, CHANCE_LABEL, NO_CITY, categoryCode, citiesFor, predict,
  programmesFor, seatsFor, summarise,
  type CutoffData, type Round, type Seat,
} from '../../calc/pgcet-predictor.ts';
import raw from '../../data/pgcet-mtech-cutoffs.json' with { type: 'json' };
import KpiRow from '../../components/KpiRow';
import ToolForm from '../../components/ToolForm';

const DATA = raw as unknown as CutoffData;
const COURSE = 'MTECH' as const;
const PAGE = 40;

const ROUNDS: { id: Round; label: string; note: string }[] = [
  { id: 'r2', label: 'Round 2 — what was still going',
    note: 'Seats still being allotted in the second round.' },
  { id: 'r1', label: 'Round 1 — the full picture',
    note: 'Every seat allotted in the first round, including ones that then closed.' },
];

export default function Predictor() {
  const id = useId();
  const [rank, setRank] = useState('');
  const [category, setCategory] = useState('GM');
  const [seat, setSeat] = useState<Seat>('rok');
  const [branch, setBranch] = useState('');
  const [city, setCity] = useState('');
  const [round, setRound] = useState<Round>('r2');
  const [showAll, setShowAll] = useState(false);
  const [pdfState, setPdfState] = useState<'idle' | 'working' | 'failed'>('idle');

  const reset = () => { setShowAll(false); setPdfState('idle'); };

  // M.Tech publishes no non-Karnataka column, so that seat type is simply not
  // offered here. seatsFor decides it from the data rather than a hardcoded list.
  const seats = useMemo(() => seatsFor(DATA, COURSE), []);
  const liveSeat = seats.some((s) => s.id === seat) ? seat : 'rok';
  const code = categoryCode(category, liveSeat);

  const branches = useMemo(() => programmesFor(DATA, COURSE, code, round), [code, round]);
  const cities = useMemo(() => citiesFor(DATA, COURSE, code, round), [code, round]);
  // A filter that no longer exists in the narrowed pool must not silently hide
  // everything, so fall back to "all" rather than keeping a stale selection.
  const liveBranch = branch && branches.includes(branch) ? branch : '';
  const liveCity = city && cities.includes(city) ? city : '';

  const parsed = rank.trim() === '' ? NaN : Number(rank);
  const { results, error } = useMemo(
    () => predict({
      rank: parsed, category, seat: liveSeat, course: COURSE,
      city: liveCity, programme: liveBranch, round, data: DATA,
    }),
    [parsed, category, liveSeat, liveCity, liveBranch, round],
  );

  const counts = summarise(results);
  const shown = showAll ? results : results.slice(0, PAGE);
  const showError = rank.trim() !== '' && error;
  const asked = rank.trim() !== '' && !error;
  const catLabel = CATEGORIES.find((c) => c.id === category)?.label ?? category;
  const seatLabel = seats.find((s) => s.id === liveSeat)?.label ?? '';

  async function onDownload() {
    setPdfState('working');
    try {
      const { downloadPredictionPdf } = await import('../../lib/predictor-pdf.ts');
      await downloadPredictionPdf(results, {
        rank: parsed, course: 'M.Tech', category: catLabel, seat: seatLabel,
        city: liveCity, year: DATA.year,
        round: ROUNDS.find((r) => r.id === round)?.label.split(' —')[0] ?? 'Round 2',
        counts,
      });
      setPdfState('idle');
    } catch {
      setPdfState('failed');
    }
  }

  return (
    <>
      <ToolForm title="Your PGCET M.Tech rank">
        <div className="field">
          <label htmlFor={`${id}-rank`}>Your PGCET rank</label>
          <input
            id={`${id}-rank`} type="number" inputMode="numeric"
            min={1} step={1} placeholder="e.g. 1800"
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
          <select id={`${id}-seat`} value={liveSeat}
            onChange={(e) => { setSeat(e.target.value as Seat); reset(); }}>
            {seats.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${id}-branch`}>Specialisation</label>
          <select id={`${id}-branch`} value={liveBranch}
            onChange={(e) => { setBranch(e.target.value); reset(); }}>
            <option value="">All {branches.length} specialisations</option>
            {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${id}-round`}>Allotment round</label>
          <select id={`${id}-round`} value={round}
            onChange={(e) => { setRound(e.target.value as Round); reset(); }}>
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

      {showError ? <p className="error" role="alert">{error}</p> : null}

      <div aria-live="polite">
        {!asked ? (
          <p className="muted pc-hint">
            Type your PGCET M.Tech rank above. M.Tech ranks run much lower than MBA and
            MCA — the state&rsquo;s widest 2025 closing rank was about 8,400, so a rank in
            the hundreds is genuinely strong here.
          </p>
        ) : results.length === 0 ? (
          <div className="card pc-empty">
            <p className="eyebrow"><span className="dot" />No match</p>
            <p>
              No M.Tech seat in KEA&rsquo;s {DATA.year}{' '}
              {round === 'r2' ? 'second' : 'first'}-round table closed at or near rank{' '}
              <strong>{parsed.toLocaleString('en-IN')}</strong> for {catLabel} on the{' '}
              {seatLabel} list
              {liveBranch ? <> in <strong>{liveBranch}</strong></> : null}
              {liveCity ? <> in <strong>{liveCity}</strong></> : null}.
            </p>
            <p className="muted">
              {liveBranch || liveCity
                ? 'Clear the specialisation or city filter first — M.Tech seats are thin, and two filters on top of a rank narrow it fast.'
                : 'M.Tech closing ranks top out near 8,400 statewide, so a rank past that clears no published seat. Check the category on your certificate, or try the other seat type.'}
            </p>
          </div>
        ) : (
          <>
            <KpiRow items={[
              { label: 'Seats in reach', value: results.length.toLocaleString('en-IN'),
                note: `M.Tech · ${catLabel}${liveBranch ? ` · ${liveBranch}` : ''}` },
              { label: CHANCE_LABEL.safe, value: counts.safe, note: 'Comfortably inside' },
              { label: CHANCE_LABEL.moderate, value: counts.moderate, note: 'Inside, but close' },
              { label: CHANCE_LABEL.reach, value: counts.reach, note: 'Just past it' },
            ]} />

            <div className="pc-bar">
              <div>
                <h2 className="pc-h">
                  {results.length.toLocaleString('en-IN')} seats for rank{' '}
                  {parsed.toLocaleString('en-IN')}
                </h2>
                <p className="muted pc-lede">
                  Most selective first. {ROUNDS.find((r) => r.id === round)?.note}
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
                    <span className="pc-branch">{r.programme}</span>
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
              {DATA.year} M.Tech, first and second round allotments. An estimate for
              shortlisting, not an allotment. Confirm everything on{' '}
              <a href="https://cetonline.karnataka.gov.in/kea/">KEA&rsquo;s own site</a>.
              {cities.includes(NO_CITY) ? (
                <> KEA publishes no district column, so a college whose city its text never
                  states is listed under &ldquo;{NO_CITY}&rdquo; rather than guessed at.</>
              ) : null}
            </p>
          </>
        )}
      </div>

      <p className="muted pc-cross">
        Looking at MBA or MCA instead?{' '}
        <Link href="/pgcet-college-predictor/">Use the MBA &amp; MCA predictor</Link>.
      </p>
    </>
  );
}
