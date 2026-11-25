'use client';

import { usePathname } from 'next/navigation';

/**
 * The current page's type and breadcrumb (lib/page-schema.ts). The shells hand it every page's graph,
 * built on the server; this picks the one for the address, so it is in the server-rendered HTML a
 * crawler reads. The home page and an article have none here: the home page is the site itself
 * (lib/schema.ts), and an article's title is not known to the shell.
 */
export function PageJsonLd({ graphs }: { graphs: Record<string, object> }) {
  // null outside a router (the unit tests): then there is no page to describe
  const path = (usePathname() ?? '').replace(/(.)\/+$/, '$1');
  const graph = graphs[path];
  if (!graph) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, '\u003c') }} />;
}
