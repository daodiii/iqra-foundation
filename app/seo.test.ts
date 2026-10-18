import { describe, expect, test } from 'vitest';
import { site } from '@/content/site.no';
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

  test('every page of the menu and both legal pages, absolute, once each', () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toEqual([...site.links, ...site.legal].map((l) => (l.href === '/' ? siteUrl : `${siteUrl}${l.href}`)));
    expect(new Set(urls).size).toBe(urls.length);
    for (const u of urls) expect(u).toMatch(/^https?:\/\//);
  });
});
