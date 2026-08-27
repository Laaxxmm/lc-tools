// One config per tool. Adding a tool = this file + a pure calc function.
// Page, schema, sitemap entry, internal links, lead gate and analytics are generated.

export type ExamFamily = 'pgcet' | 'mat' | 'cat' | 'general';

import type { IconName } from '../components/Icon';

export interface FaqItem { q: string; a: string; }

export interface ToolConfig {
  slug: string;                 // URL segment under /tools/
  title: string;                // <h1> and <title>
  tagline: string;              // one line under the h1
  eyebrow: string;              // uppercase kicker
  family: ExamFamily;           // drives ground colour: pgcet=forest, mat=teal
  // A page has one visual ground but can serve more than one exam. The study plan
  // generator builds both CAT and MAT plans, so it must appear under MAT too --
  // otherwise the MAT group renders empty while MAT is the nearest exam on the
  // calendar. Grouping only, never colour.
  alsoServes?: ExamFamily[];
  description: string;          // meta description, <=155 chars
  keywords: string[];
  // The full title is a search headline; a card needs a name. Falls back to title.
  shortName?: string;
  icon: IconName;               // card + quick-nav glyph
  // Six to nine words, scannable. The card shows this, never the tagline -- a card
  // you have to read a paragraph of is a card nobody reads.
  oneLiner: string;
  readMinutes: number;          // brand blog convention shows read time
  faq: FaqItem[];               // rendered + emitted as FAQPage schema
  related: string[];            // slugs of nearest tools
  gate: 'none' | 'email' | 'email+phone';
  cta: { label: string; href: string; note?: string };
  updated: string;              // ISO date, shown to the user
  sources?: { label: string; href: string }[];
}

// PGCET cannot be priced correctly on EduGorilla (no package of its own; inherits
// the Management ladder at Rs.999). Every PGCET CTA points at publications instead.
export const CTA = {
  pgcetMocks: {
    label: 'Get the PGCET mock series',
    href: 'https://publications.learncrew.org/?tab=mocks',
    note: 'PGCET mock series, one year of access.',
  },
  matMocks: {
    // Deep link, not the LMS root: a student who lands on the root has to find
    // the paper again themselves.
    label: 'Get the MAT test series',
    href: 'https://learn.learncrew.org/tests/1279/management-aptitude-test-mat',
    note: 'Full-length MAT papers with analysis.',
  },
  pgcetCoaching: {
    label: 'PGCET coaching',
    href: 'https://learncrew.org/pgcet-online-coaching-mba-mca/',
  },
  matCoaching: {
    label: 'MAT coaching',
    href: 'https://learncrew.org/mat-online-coaching-600plus/',
  },
  // Anchor text is a ranking signal. Pointing "PGCET coaching" at the homepage
  // spends that signal on a page that should not rank for it, and drops the
  // student on something generic.
  coaching: {
    label: 'See PGCET & MAT coaching',
    href: 'https://learncrew.org/pgcet-online-coaching-mba-mca/',
  },
  contact: {
    label: 'Talk to a mentor',
    href: 'https://learncrew.org/contact/',
  },
  demo: {
    label: 'Book a free demo',
    href: 'https://learncrew.org/contact/',
  },
  books: {
    label: 'Books & mocks',
    href: 'https://publications.learncrew.org/',
  },
  results: {
    label: 'Student results',
    href: 'https://learncrew.org/learn-crew-results/',
  },
} as const;
