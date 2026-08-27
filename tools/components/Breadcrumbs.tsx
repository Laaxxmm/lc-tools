import Link from 'next/link';
import { SITE, serialiseJsonLd } from '../lib/shell';

/**
 * Visible trail plus matching BreadcrumbList.
 *
 * Rendered together on purpose: markup that describes something the user cannot
 * see is exactly what Google penalises. The final crumb carries no `item`, which
 * is correct per spec — it is the current page.
 */
export default function Breadcrumbs({ name, slug }: { name: string; slug: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Free Tools', item: `${SITE}/tools/` },
      { '@type': 'ListItem', position: 3, name },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialiseJsonLd([jsonLd]) }} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <ol>
          <li><a href={`${SITE}/`}>Home</a></li>
          <li><Link href="/">Free tools</Link></li>
          <li><span aria-current="page">{name}</span></li>
        </ol>
      </nav>
    </>
  );
}
