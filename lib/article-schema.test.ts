import { describe, expect, test } from 'vitest';
import { newsItemMeta } from '@/components/aktuelt/NewsItemPage';
import { articleGraph } from './article-schema';
import { siteUrl } from './site-url';

const item = { slug: 'apning', title: 'Vi åpner dørene', date: '2026-12-01', summary: 'En kort ingress om åpningen.', image: { src: '/bilder/apning.jpg', alt: 'Folk i salen' } };

describe('a news item as JSON-LD', () => {
  const g = articleGraph(item)['@graph'];

  test('a NewsArticle by the foundation, at its Norwegian address, with headline, date, ingress and picture', () => {
    expect(g[0]).toMatchObject({
      '@type': 'NewsArticle',
      url: `${siteUrl}/aktuelt/nyheter/apning`,
      mainEntityOfPage: `${siteUrl}/aktuelt/nyheter/apning`,
      headline: 'Vi åpner dørene',
      datePublished: '2026-12-01',
      description: 'En kort ingress om åpningen.',
      inLanguage: 'nb',
      image: [`${siteUrl}/bilder/apning.jpg`],
      author: { '@id': `${siteUrl}/#organization` },
      publisher: { '@id': `${siteUrl}/#organization` },
    });
  });

  test('the trail Hjem › Aktuelt › Nyheter › the article', () => {
    const trail = (g[1] as { itemListElement: { name: string; position: number }[] }).itemListElement;
    expect(trail.map((c) => c.name)).toEqual(['Hjem', 'Aktuelt', 'Nyheter', 'Vi åpner dørene']);
    expect(trail.map((c) => c.position)).toEqual([1, 2, 3, 4]);
  });

  test('no picture, no image property', () => {
    expect(articleGraph({ ...item, image: null })['@graph'][0]).not.toHaveProperty('image');
  });

  test('an unknown slug has no metadata to give', () => {
    expect(newsItemMeta('finnes-ikke', 'en')).toEqual({});
  });
});
