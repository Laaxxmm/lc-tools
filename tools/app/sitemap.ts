import type { MetadataRoute } from 'next';
import { TOOLS } from '../config';
import { SITE, latestUpdated, toolUrl } from '../lib/shell';

// basePath is not applied to sitemap URLs, so these are built absolute from SITE.
// The file lands at /tools/sitemap.xml; the root robots.txt on WordPress is what
// points crawlers at it.
// output: 'export' requires the route to declare itself static.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/tools/`, lastModified: latestUpdated(TOOLS) },
    ...TOOLS.map((t) => ({ url: toolUrl(t.slug), lastModified: t.updated })),
  ];
}
