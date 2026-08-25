import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import ToolCard from '../components/ToolCard';
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
    blurb: (
      <>
        CAT is on <a href="https://iimcat.ac.in/">29 November 2026</a> and registration opened on
        3 August, so the cycle is already running. These deal with the two questions that come
        first: the score you actually need, and how the syllabus fits into the weeks you have left.
      </>
    ),
  },
  mat: {
    heading: 'MAT 2026',
    blurb: (
      <>
        AIMA runs the paper-based sitting on <a href="https://mat.aima.in/">13 September 2026</a> and
        the computer-based one on 20 September. MAT is the quickest entrance to get into, which is
        why it works as a second door when CAT timing goes against you.
      </>
    ),
  },
  pgcet: {
    heading: 'Karnataka PGCET',
    blurb: (
      <>
        The 2026 exam has concluded and{' '}
        <a href="https://cetonline.karnataka.gov.in/kea/">KEA counselling</a> is where the decisions
        are being made now. Tools in this group handle cutoffs, allotment and choice order rather
        than preparation.
      </>
    ),
  },
  general: {
    heading: 'Works for any entrance',
    blurb: (
      <>
        Eligibility, deadlines, marks and money. Nothing in this group belongs to one exam board, so
        reach for these whichever form you are filling in.
      </>
    ),
  },
};

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
            Every tool here works before it asks you for anything. You put your own numbers in, the
            answer appears on the page, and the only time an email box stands in the way is when
            there is a file we have to send you.
          </p>
          <p className="lead">
            A new tool goes up every week. What is live today sits below, grouped by the exam it
            belongs to, and the arithmetic behind each one is written out on its own page so you can
            check it instead of trusting it.
          </p>
          <p className="meta">
            <span>{TOOLS.length} tools live</span>
            <span>New tool every week</span>
            <span>Updated {formatUpdated(latestUpdated(TOOLS))}</span>
          </p>
        </div>
      </header>

      {groups.map((g) => (
        <section className="section" key={g.family}>
          <div className="container">
            <div className="section-head">
              <hr className="rule" />
              <h2>{GROUPS[g.family].heading}</h2>
              <p>{GROUPS[g.family].blurb}</p>
            </div>
            <div className="grid">
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
