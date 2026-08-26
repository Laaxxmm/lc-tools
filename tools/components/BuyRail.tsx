'use client';

import { useEffect, useState } from 'react';
import Icon, { type IconName } from './Icon';

export interface RailOffer {
  eyebrow: string;
  title: string;
  price?: string;
  href: string;
  cta: string;
  icon: IconName;
}

const HIDDEN = 'lc-buyrail-hidden';

/**
 * A buy option that stays reachable while the reader scrolls.
 *
 * Offers placed once in the page body are missed by anyone who scrolls past that
 * band. This keeps one offer within reach without covering the content: it
 * appears after the reader is past the tool, and closing it is remembered.
 */
export default function BuyRail({ offers }: { offers: RailOffer[] }) {
  const [show, setShow] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem(HIDDEN)) return;
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.9);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show || offers.length === 0) return null;
  const o = offers[i % offers.length];

  return (
    <aside className="buy-rail" aria-label="Buy options">
      <button
        className="buy-rail-close"
        type="button"
        onClick={() => { sessionStorage.setItem(HIDDEN, '1'); setShow(false); }}
        aria-label="Hide buy options"
      >×</button>
      <p className="eyebrow"><Icon name={o.icon} size={14} />{o.eyebrow}</p>
      <h3>{o.title}</h3>
      {o.price ? <p className="buy-rail-price">{o.price}</p> : null}
      <a className="btn btn-primary btn-block" href={o.href}>{o.cta}</a>
      {offers.length > 1 ? (
        <div className="buy-rail-dots" role="tablist" aria-label="Other offers">
          {offers.map((x, n) => (
            <button
              key={x.href + x.title}
              type="button"
              role="tab"
              aria-selected={n === i % offers.length}
              aria-label={x.title}
              className={n === i % offers.length ? 'is-on' : undefined}
              onClick={() => setI(n)}
            />
          ))}
        </div>
      ) : null}
    </aside>
  );
}
