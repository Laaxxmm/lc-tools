'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { EXAMS, trackerRows } from '../calc/exam-dates';
import { todayIso } from '../calc/study-plan';

const VERB: Record<string, string> = {
  opens: 'registration opens',
  closes: 'registration closes',
  exam: 'exam day',
  over: 'exam done',
};

// Real countdowns from the same verified date table the tracker uses. This is the
// homepage's live element: it is useful rather than decorative, and it is the one
// thing on the page that is different every morning.
export default function DeadlineStrip() {
  const [today, setToday] = useState('');

  // Prerendered page: reading the clock during render mismatches on hydration.
  useEffect(() => setToday(todayIso(new Date())), []);
  if (!today) return null;

  const soon = trackerRows(EXAMS, today)
    .filter((r) => r.next.kind !== 'over')
    .slice(0, 4);
  if (soon.length === 0) return null;

  return (
    <div className="deadlines">
      <p className="deadlines-label">
        <Icon name="clock" size={15} /> Closing soonest
      </p>
      <ul>
        {soon.map(({ exam, next }, i) => (
          <li key={exam.id} style={{ animationDelay: `${i * 70}ms` }}>
            <span className="d-days">{next.days}</span>
            <span className="d-unit">{next.days === 1 ? 'day' : 'days'}</span>
            <span className="d-exam">{exam.name}</span>
            <span className="d-what">
              {VERB[next.kind]}
              {next.confirmed ? '' : ' (expected)'}
            </span>
          </li>
        ))}
      </ul>
      <Link className="deadlines-more" href="/mba-exam-dates-2026/">
        All dates <Icon name="arrow" size={14} />
      </Link>
    </div>
  );
}
