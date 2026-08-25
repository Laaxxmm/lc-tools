import type { MetadataRoute } from 'next';
import { SITE } from '../lib/shell';

// ponytail: this emits /tools/robots.txt, which crawlers do not read — only the
// origin root counts, and that one belongs to WordPress. Kept because it is the
// canonical place to state the rule, and the sitemap line is what gets copied into
// the root file. Move it to the WordPress robots.txt for it to take effect.
// output: 'export' requires the route to declare itself static.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE}/tools/sitemap.xml`,
  };
}
