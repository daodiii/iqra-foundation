import { describe, expect, test } from 'vitest';
import { pageGraphs } from './page-schema';
import { siteUrl } from './site-url';

describe('pageGraphs: each page’s type and breadcrumb, as JSON-LD', () => {
  const no = pageGraphs('no');
  const en = pageGraphs('en');
  const crumbs = (g: (typeof no)[string]) => (g['@graph'][1] as { itemListElement: { position: number; name: string; item: string }[] }).itemListElement;

  test('a page for every address the site lists except the home page, in both languages', () => {
    expect(Object.keys(no).sort()).toEqual(
      ['/om-oss', '/vart-arbeid', '/menneskene-bak', '/aktuelt', '/aktuelt/nyheter', '/aktuelt/arrangementer', '/aktuelt/arkiv', '/ressurser', '/kontakt', '/stott-oss', '/personvern', '/vilkar'].sort(),
    );
    expect(Object.keys(en)).toContain('/en/about-us');
    expect(Object.keys(en)).toHaveLength(12);
  });

  test('the right type: Om oss an AboutPage, Kontakt a ContactPage, the lists CollectionPages, the rest WebPages', () => {
    const type = (g: (typeof no)[string]) => g['@graph'][0]['@type'];
    expect(type(no['/om-oss'])).toBe('AboutPage');
    expect(type(no['/kontakt'])).toBe('ContactPage');
    expect(type(no['/aktuelt/nyheter'])).toBe('CollectionPage');
    expect(type(no['/ressurser'])).toBe('CollectionPage');
    expect(type(no['/stott-oss'])).toBe('WebPage');
    expect(no['/kontakt']['@graph'][0]).toMatchObject({ url: `${siteUrl}/kontakt`, name: 'Kontakt', inLanguage: 'nb', isPartOf: { '@id': `${siteUrl}/#website` }, about: { '@id': `${siteUrl}/#organization` } });
    expect(en['/en/contact']['@graph'][0]).toMatchObject({ name: 'Contact', inLanguage: 'en' });
  });

  test('a breadcrumb from the home page, through Aktuelt where a page sits under it', () => {
    expect(crumbs(no['/kontakt'])).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Hjem', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Kontakt', item: `${siteUrl}/kontakt` },
    ]);
    expect(crumbs(no['/aktuelt/arkiv']).map((c) => c.name)).toEqual(['Hjem', 'Aktuelt', 'Arkiv']);
    expect(crumbs(en['/en/news-and-events/events']).map((c) => c.name)).toEqual(['Home', 'News and events', 'Events']);
    expect(crumbs(en['/en/news-and-events/events'])[0].item).toBe(`${siteUrl}/en`);
  });
});
