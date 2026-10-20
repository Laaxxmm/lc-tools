'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TOOLS } from '../config';
import Icon from './Icon';

// Every tool one click from every other tool. Without this each tool is a dead end
// and switching means going home and starting the hunt again.
//
// Two forms. Wide screens get the pill strip. Phones get a bar naming the tool
// you are on and an "All tools" button that opens every tool as a grid: on a 375px
// screen the strip showed two of eight pills and hid the rest behind a sideways
// swipe nobody discovers. <details> needs no script, and keying it on the path
// closes it again after every navigation.
export default function ToolNav() {
  const path = usePathname();
  const isActive = (slug: string) => path === `/${slug}/` || path === `/${slug}`;
  const current = TOOLS.find((t) => isActive(t.slug));

  return (
    <nav className="tool-switch" aria-label="All tools">
      <div className="container tool-switch-inner">
        {TOOLS.map((t) => {
          const active = isActive(t.slug);
          return (
            <Link
              key={t.slug}
              href={`/${t.slug}/`}
              className={active ? 'is-active' : undefined}
              aria-current={active ? 'page' : undefined}
            >
              <Icon name={t.icon} size={16} />
              {t.shortName ?? t.title}
            </Link>
          );
        })}
      </div>

      <details className="tool-menu" key={path}>
        <summary className="container">
          <span className="tool-menu-current">
            {current ? <Icon name={current.icon} size={16} /> : null}
            <span>{current ? (current.shortName ?? current.title) : 'Free tools'}</span>
          </span>
          <span className="tool-menu-toggle">
            All {TOOLS.length} tools
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </summary>
        <div className="tool-menu-panel">
          <ul className="container tool-menu-grid">
            {TOOLS.map((t) => {
              const active = isActive(t.slug);
              return (
                <li key={t.slug}>
                  <Link
                    href={`/${t.slug}/`}
                    className={active ? 'is-active' : undefined}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon name={t.icon} size={18} />
                    <span>
                      <strong>{t.shortName ?? t.title}</strong>
                      <small>{t.oneLiner}</small>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="container tool-menu-foot">
            <Link href="/">Every tool, explained &rarr;</Link>
          </div>
        </div>
      </details>
    </nav>
  );
}
