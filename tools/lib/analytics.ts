// Learn Crew has no analytics property right now — the old Universal Analytics one
// stopped processing in July 2023. So this module is inert by default: with
// NEXT_PUBLIC_GA4_ID unset, nothing loads, nothing is requested, no cookie is set,
// and every call below returns without touching the page. Set the env var at build
// time and gtag.js is fetched lazily on the first event, never before.
//
// Next inlines NEXT_PUBLIC_* at build time, so the missing-var branch is dead code
// in the bundle and GA4 cannot be pulled in by accident.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Returns the gtag queue, loading GA4 on first use. null = not configured, or SSR. */
function gtag(): ((...args: unknown[]) => void) | null {
  const id = process.env.NEXT_PUBLIC_GA4_ID;
  if (!id || typeof window === 'undefined') return null;
  if (window.gtag) return window.gtag;

  window.dataLayer = window.dataLayer ?? [];
  // The queue stores `arguments` objects — that is the shape gtag.js reads back.
  const queue: (...args: unknown[]) => void = function (): void {
    window.dataLayer?.push(arguments);
  };
  window.gtag = queue;

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);

  queue('js', new Date());
  queue('config', id);
  return queue;
}

const send = (event: string, slug: string): void => {
  gtag()?.('event', event, { tool_slug: slug });
};

/** Someone ran the calculation and got a result. */
export const trackToolUse = (slug: string): void => send('tool_use', slug);

/** The lead gate was rendered — the denominator for gate conversion. */
export const trackGateShown = (slug: string): void => send('gate_shown', slug);

/** The gate was submitted and accepted. */
export const trackLeadCaptured = (slug: string): void => send('lead_captured', slug);
