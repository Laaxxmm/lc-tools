'use client';

import { useEffect, useState } from 'react';

interface Head { id: string; text: string; }

// Builds an "on this page" rail from the explainer's own h2s. Long-form prose at a
// readable measure leaves width spare; this fills it with navigation rather than
// stretching lines to 130 characters or padding the page with empty margin.
export default function ProseNav() {
  const [heads, setHeads] = useState<Head[]>([]);
  const [active, setActive] = useState('');

  useEffect(() => {
    const nodes = [...document.querySelectorAll<HTMLHeadingElement>('.prose h2')];
    const list = nodes.map((n, i) => {
      if (!n.id) n.id = `s${i}-${(n.textContent ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
      return { id: n.id, text: n.textContent ?? '' };
    });
    setHeads(list);
    if (list.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting);
        if (seen.length > 0) setActive(seen[0].target.id);
      },
      { rootMargin: '-120px 0px -65% 0px' },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  if (heads.length < 2) return null;

  return (
    <nav className="prose-nav" aria-label="On this page">
      <p className="prose-nav-label">On this page</p>
      <ul>
        {heads.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`} className={active === h.id ? 'is-active' : undefined}>
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
