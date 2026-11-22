import { describe, expect, test } from 'vitest';
import { site as siteEn } from '@/content/site.en';
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

  test('every page of the menu and both legal pages, absolute, once each, in Norwegian then English; not Styringsdokumenter, a section of Ressurser now', () => {
    const urls = sitemap().map((e) => e.url);
    const pages = [...site.links, ...site.legal].filter((l) => !l.href.includes('#'));
    const abs = (href: string) => (href === '/' ? siteUrl : `${siteUrl}${href}`);
    expect(urls).toEqual([...pages.map((l) => abs(l.href)), ...[...siteEn.links, ...siteEn.legal].map((l) => abs(l.href))]);
    for (const e of sitemap()) expect(Object.keys(e.alternates?.languages ?? {})).toEqual(['nb', 'en']);
    expect(new Set(urls).size).toBe(urls.length);
    for (const u of urls) expect(u).toMatch(/^https?:\/\//);
  });
});
