'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TOOLS } from '../config';
import Icon from './Icon';

// Every tool one click from every other tool. Without this each tool is a dead end
// and switching means going home and starting the hunt again.
export default function ToolNav() {
  const path = usePathname();
  return (
    <nav className="tool-switch" aria-label="All tools">
      <div className="container tool-switch-inner">
        {TOOLS.map((t) => {
          const href = `/${t.slug}/`;
          const active = path === href || path === `/${t.slug}`;
          return (
            <Link
              key={t.slug}
              href={href}
              className={active ? 'is-active' : undefined}
              aria-current={active ? 'page' : undefined}
            >
              <Icon name={t.icon} size={16} />
              {t.shortName ?? t.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
