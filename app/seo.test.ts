import { describe, expect, test } from 'vitest';
import { site as siteEn } from '@/content/site.en';
import { site } from '@/content/site.no';
import { getNews } from '@/lib/content';
import { siteUrl } from '@/lib/site-url';
import robots from './robots';
import sitemap from './sitemap';

describe('robots.txt and the sitemap', () => {
  test('crawlers may read the pages, not the editor or its API, and are pointed at the sitemap', () => {
    const r = robots();
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rules.userAgent).toBe('*');
    expect(rules.allow).toBe('/');
    expect(rules.disallow).toEqual(['/keystatic', '/api/']);
    expect(r.sitemap).toBe(`${siteUrl}/sitemap.xml`);
  });

  test('never a blanket disallow: `noindex` only works where the crawler may read the page', () => {
    const rules = [robots().rules].flat();
    for (const rule of rules) expect([rule.disallow].flat()).not.toContain('/');
  });

  test('every page of the menu, both legal pages and the events archive, absolute, once each, in Norwegian then English; not Styringsdokumenter, a section of Ressurser now', () => {
    const all = sitemap();
    const urls = all.filter((e) => !e.lastModified).map((e) => e.url);
    const pages = [...site.links, ...site.legal].filter((l) => !l.href.includes('#'));
    const abs = (href: string) => (href === '/' ? siteUrl : `${siteUrl}${href}`);
    expect(urls).toEqual([
      ...pages.map((l) => abs(l.href)),
      abs('/aktuelt/arkiv'),
      ...[...siteEn.links, ...siteEn.legal].map((l) => abs(l.href)),
      abs('/en/news-and-events/archive'),
    ]);
    for (const e of all.filter((x) => !x.lastModified)) expect(Object.keys(e.alternates?.languages ?? {})).toEqual(['nb', 'en', 'x-default']);
    for (const e of all) expect(e.alternates?.languages?.['x-default']).toBe(e.alternates?.languages?.nb);
    expect(new Set(urls).size).toBe(urls.length);
    for (const u of urls) expect(u).toMatch(/^https?:\/\//);
  });

  test('each news item with a page, at its Norwegian address alone, dated by its own date', () => {
    const news = getNews().filter((n) => n.body);
    const dated = sitemap().filter((e) => e.lastModified);
    expect(dated.map((e) => e.url)).toEqual(news.map((n) => `${siteUrl}/aktuelt/nyheter/${n.slug}`));
    for (const [i, n] of news.entries()) {
      expect(dated[i].lastModified).toBe(n.date);
      expect(Object.keys(dated[i].alternates?.languages ?? {})).toEqual(['nb', 'x-default']);
    }
  });
});
