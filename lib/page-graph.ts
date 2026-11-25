/**
 * Builds one page's JSON-LD from its row in the page table (lib/page-schema.ts). Pure and free of the
 * site's content, so `PageJsonLd` can run it in the browser from a small table instead of carrying
 * every page's finished graph in every page's payload (SEO audit, second run, 2026-11-25).
 */

export type Kind = 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage';

/** One page: its kind, its name and search description, and the trail to it (home first, itself last). */
export type PageRow = { kind: Kind; name: string; description?: string; trail: { name: string; href: string }[] };

export type Graph = { '@context': 'https://schema.org'; '@graph': Record<string, unknown>[] };

export function graphFor(href: string, row: PageRow, siteUrl: string, inLanguage: string): Graph {
  const abs = (h: string) => (h === '/' ? siteUrl : `${siteUrl}${h}`);
  const url = abs(href);
  const crumbs = row.trail.length > 1;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': row.kind,
        '@id': `${url}#webpage`,
        url,
        name: row.name,
        ...(row.description ? { description: row.description } : {}),
        inLanguage,
        isPartOf: { '@id': `${siteUrl}/#website` },
        about: { '@id': `${siteUrl}/#organization` },
        ...(crumbs ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
      },
      ...(crumbs
        ? [
            {
              '@type': 'BreadcrumbList',
              '@id': `${url}#breadcrumb`,
              itemListElement: row.trail.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.href) })),
            },
          ]
        : []),
    ],
  };
}

/** Escaped for a <script> body, as Next's JSON-LD guide does: no value can close the tag. */
export const ldJson = (graph: object) => JSON.stringify(graph).replace(/</g, '\\u003c');
