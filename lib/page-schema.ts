import { copy } from '@/content/copy';
import { type Lang, type PageKey, PATHS } from '@/content/paths';
import { siteUrl } from './site-url';

/**
 * Each page's own JSON-LD (2026-11-25, from the SEO audit): what kind of page it is and the trail to it
 * from the home page, tied to the site and the foundation by the @ids in lib/schema.ts. The names are
 * the menu's own labels, so the trail reads as the menu does. Computed on the server for every page
 * at once and handed to `PageJsonLd`, which picks the one for the address it is on.
 */

type Kind = 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage';

/** The pages in the trail, with their kind and, for those under Aktuelt, their parent. */
const PAGES: Partial<Record<PageKey, { kind: Kind; parent?: PageKey }>> = {
  about: { kind: 'AboutPage' },
  work: { kind: 'WebPage' },
  people: { kind: 'AboutPage' },
  news: { kind: 'CollectionPage' },
  newsItems: { kind: 'CollectionPage', parent: 'news' },
  events: { kind: 'CollectionPage', parent: 'news' },
  archive: { kind: 'CollectionPage', parent: 'news' },
  resources: { kind: 'CollectionPage' },
  contact: { kind: 'ContactPage' },
  support: { kind: 'WebPage' },
  privacy: { kind: 'WebPage' },
  terms: { kind: 'WebPage' },
};

type Graph = { '@context': string; '@graph': Record<string, unknown>[] };

const abs = (href: string) => (href === '/' ? siteUrl : `${siteUrl}${href}`);

export function pageGraphs(lang: Lang): Record<string, Graph> {
  const { site } = copy(lang);
  const labels = new Map<string, string>();
  for (const l of [...site.links, ...site.legal]) labels.set(l.href, l.label);
  labels.set(PATHS.archive[lang], site.pages.news.archiveTitle);
  const name = (key: PageKey) => labels.get(PATHS[key][lang]) ?? '';
  const crumb = (key: PageKey, position: number) => ({ '@type': 'ListItem', position, name: name(key), item: abs(PATHS[key][lang]) });

  const out: Record<string, Graph> = {};
  for (const [key, page] of Object.entries(PAGES) as [PageKey, { kind: Kind; parent?: PageKey }][]) {
    const href = PATHS[key][lang];
    const url = abs(href);
    const trail: PageKey[] = ['home', ...(page.parent ? [page.parent] : []), key];
    out[href] = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': page.kind,
          '@id': `${url}#webpage`,
          url,
          name: name(key),
          inLanguage: site.lang,
          isPartOf: { '@id': `${siteUrl}/#website` },
          about: { '@id': `${siteUrl}/#organization` },
          breadcrumb: { '@id': `${url}#breadcrumb` },
        },
        { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: trail.map((k, i) => crumb(k, i + 1)) },
      ],
    };
  }
  return out;
}
