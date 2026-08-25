'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { formatUpdated as formatDate } from '../../lib/shell';
import { EXAMS, trackerRows, type Milestone, type StreamFilter } from '../../calc/exam-dates';

const KIND_LABEL: Record<Milestone['kind'], string> = {
  opens: 'Registration opens in',
  closes: 'Registration closes in',
  exam: 'Exam day in',
  over: 'Exam was held',
};

const STREAMS: { value: StreamFilter; label: string }[] = [
  { value: 'all', label: 'MBA and MCA' },
  { value: 'mba', label: 'MBA only' },
  { value: 'mca', label: 'MCA only' },
];

function Tag({ confirmed }: { confirmed: boolean }) {
  return (
    <span className={`xd-tag ${confirmed ? 'xd-yes' : 'xd-no'}`}>
      {confirmed ? 'Confirmed' : 'Expected'}
    </span>
  );
}

/**
 * `builtOn` is the date the page was exported. It seeds the first render so the
 * server HTML and the first client render agree, then the effect swaps in the
 * reader's own date. A page cached for three weeks still counts correctly.
 */
export default function Tracker({ builtOn }: { builtOn: string }) {
  const id = useId();
  const [today, setToday] = useState(builtOn);
  const [stream, setStream] = useState<StreamFilter>('all');
  const [confirmedOnly, setConfirmedOnly] = useState(false);

  useEffect(() => {
    // en-CA formats as YYYY-MM-DD in the reader's own timezone. toISOString would
    // give UTC, which is the previous day for anyone in India before 5:30am and
    // would quietly add a day to every countdown.
    setToday(new Date().toLocaleDateString('en-CA'));
  }, []);

  const rows = useMemo(
    () => trackerRows(EXAMS, today, stream).filter((r) => !confirmedOnly || r.exam.examConfirmed),
    [today, stream, confirmedOnly],
  );

  const confirmedCount = EXAMS.filter((e) => e.examConfirmed).length;

  return (
    <div>
      <p className="eyebrow"><span className="dot" />Sorted by what closes first</p>
      <h2>Every entrance, nearest deadline first</h2>
      <p className="xd-standfirst">
        {confirmedCount} of the {EXAMS.length} exam dates below are published by the exam body.
        The rest are what the usual cycle points to, and each one says so on its own row.
        Counting from {formatDate(today)}.
      </p>

      <div className="xd-controls">
        <div className="field">
          <label htmlFor={`${id}-stream`}>Show</label>
          <select
            id={`${id}-stream`}
            value={stream}
            onChange={(e) => setStream(e.target.value as StreamFilter)}
          >
            {STREAMS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <label className="consent xd-toggle" htmlFor={`${id}-confirmed`}>
          <input
            id={`${id}-confirmed`}
            type="checkbox"
            checked={confirmedOnly}
            onChange={(e) => setConfirmedOnly(e.target.checked)}
          />
          <span>Hide expected dates, show only what is confirmed</span>
        </label>
      </div>

      {rows.length === 0 ? (
        <p className="card">
          No confirmed dates in that stream yet. Clear the filter to see what is expected,
          or check the official sites listed under each exam.
        </p>
      ) : (
        <ol className="xd-list">
          {rows.map((r, i) => (
            <li
              key={r.exam.id}
              className={`card xd-row${i === 0 && r.next.kind !== 'over' ? ' xd-soon' : ''}`}
            >
              <div className="xd-count">
                <span className="xd-n">{r.next.days}</span>
                <span className="xd-u">{r.next.days === 1 ? 'day' : 'days'}</span>
              </div>

              <div>
                <p className="xd-kind">
                  {KIND_LABEL[r.next.kind]}
                  {r.next.kind === 'over' ? ' ago' : ''}
                  {' · '}
                  {formatDate(r.next.date)}
                  <Tag confirmed={r.next.confirmed} />
                </p>

                <h3>{r.exam.name}</h3>

                <p className="xd-line">
                  <span className="xd-k">Exam:</span> {r.exam.examLabel}
                  <Tag confirmed={r.exam.examConfirmed} />
                </p>
                <p className="xd-line">
                  <span className="xd-k">Registration:</span> {r.exam.regLabel}
                  <Tag confirmed={r.exam.regConfirmed} />
                </p>

                {r.exam.note ? <p className="xd-note">{r.exam.note}</p> : null}

                <p className="xd-note">
                  Conducted by {r.exam.conductedBy}.{' '}
                  <a className="xd-src" href={r.exam.site} rel="noopener">
                    Check the official site
                  </a>
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <p className="muted xd-foot">
        Dates move. This page is the shortlist, not the notification, and the site on each row
        is the one that decides. If a date here has already passed, trust theirs over ours.
      </p>
    </div>
  );
}
