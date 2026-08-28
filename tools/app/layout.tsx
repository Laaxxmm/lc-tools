import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Poppins } from 'next/font/google';
import Link from 'next/link';
import AttributionCapture from '../components/AttributionCapture';
import GoogleTagManager from '../components/GoogleTagManager';
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
  icons: {
    icon: [
      { url: '/tools/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/tools/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/tools/apple-touch-icon.png',
  },
  metadataBase: new URL(SITE),
  // Without these, every share into a WhatsApp or Telegram exam group renders as
  // a bare URL — no title, no description, no image. That is the main way these
  // tools travel, so it is not cosmetic.
  openGraph: {
    type: 'website',
    siteName: 'Learn Crew',
    locale: 'en_IN',
    images: [{ url: '/tools/og-default.png', width: 1200, height: 630, alt: 'Learn Crew free tools' }],
  },
  twitter: { card: 'summary_large_image', images: ['/tools/og-default.png'] },
  title: {
    default: 'Free tools for MBA and MCA entrance aspirants | Learn Crew Tools',
    template: '%s | Learn Crew Tools',
  },
  description:
    'Calculators, planners and trackers for CAT, MAT, PGCET and MCA entrance exams. Every tool gives you the answer before it asks for anything.',
};

const PROPERTIES = [
  { label: 'Coaching', href: 'https://learncrew.org/pgcet-online-coaching-mba-mca/' },
  { label: 'Mocks', href: 'https://learn.learncrew.org/' },
  { label: 'Books', href: 'https://publications.learncrew.org/' },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <body className={`lcp ${poppins.variable}`}>
        <GoogleTagManager />
        <AttributionCapture />
        <a className="skip" href="#main">Skip to content</a>

        {/* Announcement ribbon, matching learncrew.org's .lcp-announce. */}
        <div className="lc-announce">
          {/* The ribbon promises MAT coaching, so it lands on the MAT coaching
              page — not the homepage the reader then has to search from. */}
          <a href="https://learncrew.org/mat-online-coaching-600plus/">
            <strong>MAT Sep 2026</strong> — paper-based test 13 Sept · coaching batches enrolling{' '}
            <span className="lc-arrow" aria-hidden="true">&rarr;</span>
          </a>
        </div>

        <header className="lc-header">
          <div className="container lc-header-inner">
            <Link className="lc-brand" href="/" aria-label="Learn Crew Tools home">
              {/* The wordmark already carries "Your journey to success" — never
                  repeat the tagline beside it. */}
              <img src="/tools/learn-crew-logo.png" width={272} height={92} alt="Learn Crew" />
            </Link>
            <nav className="lc-nav" aria-label="Learn Crew sites">
              {PROPERTIES.map((p) => (
                <a key={p.href} href={p.href}>{p.label}</a>
              ))}
            </nav>
            <a className="btn btn-primary lc-header-cta" href="https://learncrew.org/contact/">
              Book a free demo
            </a>
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
                {/* Mark plus wordmark, set as a lockup. The mark's outline is
                    black, so it sits on a cream badge to stay legible on the
                    forest ground. */}
                <span className="foot-lockup">
                  <span className="foot-mark">
                    <img src="/tools/learn-crew-mark.png" width={192} height={192} alt="" aria-hidden="true" />
                  </span>
                  <span className="foot-name">Learn Crew</span>
                </span>
                <p>
                  Learn Crew (Learncrew Talent Pvt Ltd), Bengaluru &mdash; online across India.
                </p>
                <p className="foot-contact">
                  <a href="tel:+919738255304">+91 97382 55304</a>
                </p>
              </div>

              <div className="foot-col">
                <h2>Programs</h2>
                <a href="https://learncrew.org/pgcet-online-coaching-mba-mca/">PGCET Coaching</a>
                <a href="https://learncrew.org/mat-online-coaching-600plus/">MAT Coaching</a>
                <a href="https://learncrew.org/learn-crew-results/">Results</a>
                <a href="https://learncrew.org/blog/">Blog</a>
                <a href="https://publications.learncrew.org/">Books &amp; Mocks</a>
              </div>

              <div className="foot-col">
                <h2>Free tools</h2>
                {TOOLS.map((t) => (
                  <Link key={t.slug} href={`/${t.slug}/`}>{t.shortName ?? t.title}</Link>
                ))}
                <Link href="/">All tools</Link>
              </div>

              <div className="foot-col">
                <h2>Company</h2>
                <a href="https://learncrew.org/contact/">Contact</a>
                <a href="https://learncrew.org/privacy-policy/">Privacy</a>
                <a href="https://learncrew.org/terms-conditions/">Terms</a>
                <a href="https://learncrew.org/return-refund-policy/">Refunds</a>
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
