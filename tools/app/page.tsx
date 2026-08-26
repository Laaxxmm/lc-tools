import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import ToolCard from '../components/ToolCard';
import Icon from '../components/Icon';
import { TOOLS } from '../config';
import { CTA, type ExamFamily } from '../lib/types';
import { SITE, formatUpdated, groupByFamily, latestUpdated } from '../lib/shell';

export const metadata: Metadata = {
  alternates: { canonical: `${SITE}/tools/` },
  keywords: [
    'free mba entrance tools',
    'cat 2026 calculator',
    'mat 2026 tools',
    'mca entrance calculator',
    'karnataka pgcet tools',
  ],
};

// Copy per exam family. Every date here is on the verified list; anything the exam
// body has not published stays off this page and lives on the tracker, labelled.
const GROUPS: Record<ExamFamily, { heading: string; blurb: ReactNode }> = {
  cat: {
    heading: 'CAT 2026',
    blurb: <>Exam <a href="https://iimcat.ac.in/">29 November</a>. Registration is already open.</>,
  },
  mat: {
    heading: 'MAT 2026',
    blurb: <>Paper-based <a href="https://mat.aima.in/">13 September</a>, computer-based 20 September. The quickest entrance to get into.</>,
  },
  pgcet: {
    heading: 'Karnataka PGCET',
    blurb: <>Exam done. <a href="https://cetonline.karnataka.gov.in/kea/">KEA counselling</a> is where the decisions happen now.</>,
  },
  general: {
    heading: 'Works for any entrance',
    blurb: <>Eligibility, deadlines, marks and money. Whichever form you are filling in.</>,
  },
};

// The order a student actually needs these in, which is why they are numbered.
const FLOW = [
  { q: 'Can I even apply?', slug: 'mba-exam-eligibility-checker', to: 'Eligibility checker' },
  { q: 'When is the deadline?', slug: 'mba-exam-dates-2026', to: 'Dates & deadlines' },
  { q: 'How do I use the weeks left?', slug: 'cat-mat-study-plan-generator', to: 'Study plan' },
  { q: 'What score do I need?', slug: 'cat-percentile-target-calculator', to: 'Percentile target' },
];

const HUB_CTAS = [CTA.coaching, CTA.matMocks, CTA.pgcetMocks];

export default function Page() {
  const groups = groupByFamily(TOOLS);

  return (
    <article>
      <header className="tool-hero ground-pgcet">
        <div className="container">
          <p className="eyebrow"><span className="dot" />Learn Crew Tools</p>
          <h1>Free tools for MBA and MCA entrance aspirants</h1>
          <p className="lead">
            Every tool works before it asks you for anything. Put your numbers in, get the answer
            on the page.
          </p>
          <nav className="quicknav" aria-label="Jump to a tool">
            {TOOLS.map((t) => (
              <a key={t.slug} href={`/tools/${t.slug}/`}>
                <Icon name={t.icon} size={17} />
                {t.shortName ?? t.title}
              </a>
            ))}
          </nav>
          <p className="meta">
            <span>{TOOLS.length} tools live</span>
            <span>New tool every week</span>
            <span>Updated {formatUpdated(latestUpdated(TOOLS))}</span>
          </p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <hr className="rule" />
            <h2>Not sure which one?</h2>
            <p>Find the question you are actually asking.</p>
          </div>
          <div className="flow">
            {FLOW.map((f) => (
              <a key={f.slug} href={`/tools/${f.slug}/`}>
                <span className="step" />
                <span className="q">{f.q}</span>
                <span className="a">{f.to} <Icon name="arrow" size={15} /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {groups.map((g) => (
        <section className="section" key={g.family}>
          <div className="container">
            <div className="section-head">
              <hr className="rule" />
              <h2>{GROUPS[g.family].heading}</h2>
              <p>{GROUPS[g.family].blurb}</p>
            </div>
            <div className="tool-grid">
              {g.tools.map((t) => <ToolCard key={t.slug} tool={t} />)}
            </div>
          </div>
        </section>
      ))}

      <section className="section">
        <div className="container">
          <div className="cta-block ground-pgcet">
            <p className="eyebrow"><span className="dot" />The rest of Learn Crew</p>
            <p>
              The tools stay free and stay free of a signup wall. When you want the classes, the
              full-length papers or the books that go with them, they are one click away.
            </p>
            <div className="cta-row">
              {HUB_CTAS.map((c) => (
                <a className="btn btn-amber" key={c.href} href={c.href}>{c.label}</a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
