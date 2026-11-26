'use client';

import { usePathname } from 'next/navigation';
import { graphFor, ldJson, type PageRow } from '@/lib/page-graph';

/**
 * The table key for an address: no trailing slash, and `/index` read as the folder it names.
 * Vercel regenerates the hourly front page under `/index`, and `usePathname()` can report that on
 * the server while the browser reports `/`. The server then rendered nothing and the browser a
 * script: a hydration mismatch that made React rebuild the page and drop `data-js` (2026-11-26).
 */
export function pagePath(raw: string | null): string {
  const p = (raw ?? '').replace(/(.)\/+$/, '$1');
  return p.replace(/\/index$/, '') || (p ? '/' : '');
}

/**
 * The current page's type, description and breadcrumb (lib/page-schema.ts). The shells hand it the
 * page table, built on the server; this builds the one graph for the address, so it is in the
 * server-rendered HTML a crawler reads. An article has none here: its own page carries a NewsArticle
 * (components/aktuelt/NewsItemPage.tsx).
 */
export function PageJsonLd({ table, siteUrl, inLanguage }: { table: Record<string, PageRow>; siteUrl: string; inLanguage: string }) {
  // null outside a router (the unit tests): then there is no page to describe
  const path = pagePath(usePathname());
  const row = table[path];
  if (!row) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(graphFor(path, row, siteUrl, inLanguage)) }} />;
}
