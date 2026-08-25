import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Poppins } from 'next/font/google';
import Link from 'next/link';
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

        <main id="main">{children}</main>

        <footer className="lc-footer">
          <div className="container">
            <span className="wordmark">Learn Crew</span>
            <p>
              You get the working tool first and the answer for free. Buy something only if
              you want the practice that goes with it.
            </p>
            <nav className="lc-nav" aria-label="Learn Crew sites">
              {PROPERTIES.map((p) => (
                <a key={p.href} href={p.href}>{p.label}</a>
              ))}
              <Link href="/">All tools</Link>
            </nav>
            <p><small>&copy; Learn Crew. Bengaluru.</small></p>
          </div>
        </footer>
      </body>
    </html>
  );
}
