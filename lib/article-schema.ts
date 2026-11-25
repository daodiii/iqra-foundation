import { copy } from '@/content/copy';
import { newsItemPath, PATHS } from '@/content/paths';
import type { NewsItem } from './content';
import type { Graph } from './page-graph';
import { siteUrl } from './site-url';

/**
 * A news item as JSON-LD (SEO audit, second run, 2026-11-25): a NewsArticle by the foundation, with its
 * headline, date, ingress and picture, and the trail Hjem › Aktuelt › Nyheter › the article. On the
 * Norwegian page only, which is the article's canonical address.
 */
export function articleGraph(n: Pick<NewsItem, 'slug' | 'title' | 'date' | 'summary' | 'image'>): Graph {
  const { site } = copy('no');
  const abs = (h: string) => (h.startsWith('http') ? h : h === '/' ? siteUrl : `${siteUrl}${h}`);
  const url = abs(newsItemPath(n.slug, 'no'));
  const label = (href: string) => site.links.find((l) => l.href === href)?.label ?? '';
  const org = { '@id': `${siteUrl}/#organization` };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        '@id': `${url}#article`,
        mainEntityOfPage: url,
        url,
        headline: n.title,
        description: n.summary,
        datePublished: n.date,
        inLanguage: 'nb',
        ...(n.image ? { image: [abs(n.image.src)] } : {}),
        author: org,
        publisher: org,
        isPartOf: { '@id': `${siteUrl}/#website` },
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { name: label(PATHS.home.no), item: siteUrl },
          { name: label(PATHS.news.no), item: abs(PATHS.news.no) },
          { name: label(PATHS.newsItems.no), item: abs(PATHS.newsItems.no) },
          { name: n.title, item: url },
        ].map((c, i) => ({ '@type': 'ListItem', position: i + 1, ...c })),
      },
    ],
  };
}
