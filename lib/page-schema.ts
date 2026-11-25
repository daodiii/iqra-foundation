import { copy } from '@/content/copy';
import { type Lang, type PageKey, PATHS } from '@/content/paths';
import { SEO } from '@/content/seo';
import { graphFor, type Graph, type Kind, type PageRow } from './page-graph';
import { siteUrl } from './site-url';

/**
 * Each page's own JSON-LD (2026-11-25, from the SEO audit): what kind of page it is, its search
 * description, and the trail to it from the home page, tied to the site and the foundation by the
 * @ids in lib/schema.ts. The names are the menu's own labels, so the trail reads as the menu does.
 *
 * The shells hand `PageJsonLd` this small table, and it builds the one graph for the address it is on
 * (lib/page-graph.ts): the finished graphs of every page were about 9 KB of every page's payload.
 */

/** The pages with their kind and, for those under Aktuelt, their parent. The home page has no trail. */
const PAGES: Partial<Record<PageKey, { kind: Kind; parent?: PageKey }>> = {
  home: { kind: 'WebPage' },
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

export function pageTable(lang: Lang): Record<string, PageRow> {
  const { site } = copy(lang);
  const labels = new Map<string, string>();
  for (const l of [...site.links, ...site.legal]) labels.set(l.href, l.label);
  labels.set(PATHS.archive[lang], site.pages.news.archiveTitle);
  const name = (key: PageKey) => (key === 'home' ? site.name : (labels.get(PATHS[key][lang]) ?? ''));
  const crumb = (key: PageKey) => ({ name: key === 'home' ? (labels.get(PATHS.home[lang]) ?? site.name) : name(key), href: PATHS[key][lang] });

  const out: Record<string, PageRow> = {};
  for (const [key, page] of Object.entries(PAGES) as [PageKey, { kind: Kind; parent?: PageKey }][]) {
    const trail: PageKey[] = key === 'home' ? ['home'] : ['home', ...(page.parent ? [page.parent] : []), key];
    out[PATHS[key][lang]] = { kind: page.kind, name: name(key), description: SEO[lang][key]?.description, trail: trail.map(crumb) };
  }
  return out;
}

/** Every page's finished graph: what `PageJsonLd` builds in the browser, for the tests and the server. */
export function pageGraphs(lang: Lang): Record<string, Graph> {
  const inLanguage = copy(lang).site.lang;
  return Object.fromEntries(Object.entries(pageTable(lang)).map(([href, row]) => [href, graphFor(href, row, siteUrl, inLanguage)]));
}
