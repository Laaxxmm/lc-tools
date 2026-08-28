'use client';

import { useEffect } from 'react';
import { captureAttribution } from '../lib/attribution.ts';

/**
 * Records gclid / UTM once per page load.
 *
 * Mounted in the root layout because the tools site is a static export: there is
 * no server to read the query string, and the site-wide snippet on learncrew.org
 * cannot reach these pages (they are uploaded to public_html/tools/ and never
 * pass through WordPress).
 *
 * Renders nothing and blocks nothing — the effect runs after paint.
 */
export default function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);

  return null;
}
