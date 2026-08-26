import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Poppins } from 'next/font/google';
import Link from 'next/link';
import ToolNav from '../components/ToolNav';
import { TOOLS } from '../config';
import { SITE } from '../lib/shell';
import './globals.css';

// next/font self-hosts the files, so it owns the family name. Binding it to
// --font keeps globals.css the single place the typeface is referenced.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  variable: '--font',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Free tools for MBA and MCA entrance aspirants | Learn Crew Tools',
    template: '%s | Learn Crew Tools',
  },
  description:
    'Calculators, planners and trackers for CAT, MAT, PGCET and MCA entrance exams. Every tool gives you the answer before it asks for anything.',
};

const PROPERTIES = [
  { label: 'Coaching', href: 'https://learncrew.org/' },
  { label: 'Mocks', href: 'https://learn.learncrew.org/' },
  { label: 'Books', href: 'https://publications.learncrew.org/' },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <body className={`lcp ${poppins.variable}`}>
        <a className="skip" href="#main">Skip to content</a>

        <header className="lc-header">
          <div className="container">
            <Link className="wordmark" href="/">Learn Crew</Link>
            <nav className="lc-nav" aria-label="Learn Crew sites">
              {PROPERTIES.map((p) => (
                <a key={p.href} href={p.href}>{p.label}</a>
              ))}
            </nav>
          </div>
        </header>
        <ToolNav />

        <main id="main">{children}</main>

        {/* Mirrors the learncrew.org footer: forest-deep ground, cream at 85%,
            Programs / Tools / Company columns, legal bar. */}
        <footer className="lc-footer">
          <div className="container">
            <div className="foot-top">
              <div className="foot-brand">
                <span className="wordmark">Learn Crew</span>
                <p>
                  Learn Crew (Learncrew Talent Pvt Ltd), Bengaluru &mdash; online across India.
                </p>
                <p className="foot-contact">
                  <a href="tel:+919738255304">+91 97382 55304</a>
                </p>
              </div>

              <div className="foot-col">
                <h2>Programs</h2>
                <a href="https://learncrew.org/">PGCET Coaching</a>
                <a href="https://learncrew.org/">MAT Coaching</a>
                <a href="https://learncrew.org/learn-crew-results/">Results</a>
                <a href="https://learncrew.org/blog/">Blog</a>
                <a href="https://publications.learncrew.org/">Books &amp; Mocks</a>
              </div>

              <div className="foot-col">
                <h2>Free tools</h2>
                {TOOLS.slice(0, 5).map((t) => (
                  <Link key={t.slug} href={`/${t.slug}/`}>{t.shortName ?? t.title}</Link>
                ))}
                <Link href="/">All tools</Link>
              </div>

              <div className="foot-col">
                <h2>Company</h2>
                <a href="https://learncrew.org/contact/">Contact</a>
                <a href="https://learncrew.org/privacy-policy/">Privacy</a>
                <a href="https://learncrew.org/terms/">Terms</a>
                <a href="https://learncrew.org/refund-policy/">Refunds</a>
              </div>
            </div>

            <div className="foot-legal">
              <p>&copy; 2026 Learncrew Talent Pvt Ltd. All rights reserved.</p>
              <p>PGCET &middot; MAT online coaching | Books &amp; mocks for PGCET, MAT, CLAT, CAT</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
