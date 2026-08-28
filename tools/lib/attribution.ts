// Where a lead came from. Without this every tools lead reaches the sheet
// indistinguishable from organic, because the tools site is a static export
// served from public_html/tools/ — WordPress never renders it, so the
// site-wide gclid snippet on learncrew.org does not reach these pages.
//
// Capture happens once per landing. Classification is pure and tested.
// Nothing here sets a cookie: localStorage only, same-origin, no third party.

export interface Attribution {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  firstSeen?: string;
  firstReferrer?: string;
  landingPage?: string;
  channel?: Channel;
}

export type Channel =
  | 'google-ads'
  | 'paid-other'
  | 'google-organic'
  | 'search-organic'
  | 'social-organic'
  | 'referral'
  | 'direct'
  | `campaign-${string}`;

export const STORAGE_KEY = 'lc_attr';

/**
 * Which channel this visit belongs to. Pure — the caller supplies the state, so
 * this is testable without a DOM and behaves identically on the WordPress side.
 *
 * Click IDs win over UTMs: a gclid is Google's own evidence of an ad click,
 * while utm_medium is whatever someone typed into a link builder.
 */
export function classify(a: Attribution): Channel {
  if (a.gclid || a.gbraid || a.wbraid) return 'google-ads';

  const medium = (a.utmMedium ?? '').toLowerCase();
  if (medium === 'cpc' || medium === 'ppc' || medium === 'paid') return 'paid-other';
  if (a.utmSource) return `campaign-${a.utmSource}`;

  const ref = (a.firstReferrer ?? '').toLowerCase();
  if (!ref) return 'direct';
  if (ref.includes('google.')) return 'google-organic';
  if (ref.includes('bing.') || ref.includes('duckduckgo') || ref.includes('yahoo')) return 'search-organic';
  if (
    ref.includes('instagram') || ref.includes('facebook') ||
    ref.includes('linkedin') || ref.includes('youtube')
  ) {
    return 'social-organic';
  }
  return 'referral';
}

/** True when the URL carries something worth overwriting last-touch with. */
export function isTagged(a: Attribution): boolean {
  return Boolean(a.gclid || a.gbraid || a.wbraid || a.utmSource);
}

/**
 * Merge a fresh visit into whatever is already stored.
 *
 * First touch is written once and never overwritten — it is the honest answer to
 * "what originally brought this student here". Last touch only moves when the new
 * visit is actually tagged, so an internal navigation cannot wipe a gclid.
 */
export function merge(stored: Attribution, incoming: Attribution, now: string): Attribution {
  const next: Attribution = { ...stored };

  if (!next.firstSeen) {
    next.firstSeen = now;
    next.firstReferrer = incoming.firstReferrer ?? '';
    next.landingPage = incoming.landingPage ?? '';
  }

  if (isTagged(incoming)) {
    // The whole last-touch set moves together. Carrying a click id forward here
    // would pin channel to google-ads for good: a later newsletter or organic
    // visit still classifies as a paid click, because classify() sees the stale
    // gclid. An untagged visit is not this branch, so a plain internal
    // navigation still cannot wipe anything.
    next.gclid = incoming.gclid;
    next.gbraid = incoming.gbraid;
    next.wbraid = incoming.wbraid;
    next.utmSource = incoming.utmSource;
    next.utmMedium = incoming.utmMedium;
    next.utmCampaign = incoming.utmCampaign;
    next.utmTerm = incoming.utmTerm;
    next.landingPage = incoming.landingPage ?? next.landingPage;
  }

  next.channel = classify(next);
  return next;
}

function read(): Attribution {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Attribution;
  } catch {
    return {};
  }
}

/** Read the current attribution. Safe during SSR and with storage blocked. */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return {};
  const a = read();
  return { ...a, channel: classify(a) };
}

/**
 * Record this visit. Call once per page load, client side only.
 * Every storage access is guarded: private mode and blocked-cookie browsers
 * must not break a calculator.
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return;
  }
  const q = (k: string) => params.get(k) ?? undefined;

  const incoming: Attribution = {
    gclid: q('gclid'),
    gbraid: q('gbraid'),
    wbraid: q('wbraid'),
    utmSource: q('utm_source'),
    utmMedium: q('utm_medium'),
    utmCampaign: q('utm_campaign'),
    utmTerm: q('utm_term'),
    firstReferrer: document.referrer || '',
    landingPage: window.location.pathname,
  };

  try {
    const next = merge(read(), incoming, new Date().toISOString());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable. The tool still works; the lead just arrives unattributed.
  }
}
