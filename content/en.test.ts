import { describe, expect, test } from 'vitest';
import { brief as briefEn } from './brief.en';
import { brief as briefNo } from './brief.no';
import { klient as klientEn } from './klient.en';
import { klient as klientNo } from './klient.no';
import { privacy as privacyEn, terms as termsEn } from './legal.en';
import { privacy as privacyNo, terms as termsNo } from './legal.no';
import { counterpart, langOf, newsItemPath, PATHS } from './paths';
import { site as siteEn } from './site.en';
import { site as siteNo } from './site.no';

/** Every path to a leaf, with arrays by index: two files with the same list have the same shape. */
function shape(v: unknown, at = ''): string[] {
  if (Array.isArray(v)) return v.flatMap((x, i) => shape(x, `${at}[${i}]`));
  if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => shape(x, at ? `${at}.${k}` : k));
  return [at];
}

/** Every string leaf. */
function strings(v: unknown): string[] {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap(strings);
  if (v && typeof v === 'object') return Object.values(v).flatMap(strings);
  return [];
}

describe('the English copy', () => {
  test.each([
    ['klient', klientNo, klientEn],
    ['site', siteNo, siteEn],
    ['brief', briefNo, briefEn],
    ['privacy', privacyNo, privacyEn],
    ['terms', termsNo, termsEn],
  ])('%s has the same keys, lists and lengths as the Norwegian', (_, no, en) => {
    expect(shape(en)).toEqual(shape(no));
  });

  test('says no Norwegian letters in its own words', () => {
    // names, addresses and the authorities' Norwegian names are allowed: they are the same in both
    const allowed = /Stiftelsestilsynet|Datatilsynet|Postboks|Norsk|På norsk/;
    const own = [...strings(klientEn), ...strings(siteEn), ...strings(briefEn), ...strings(privacyEn), ...strings(termsEn)];
    const odd = own.filter((s) => /[æøåÆØÅ]/.test(s) && !allowed.test(s));
    expect(odd).toEqual([]);
  });

  test('keeps the dashes out: a pause is a comma or a full stop', () => {
    const own = [...strings(klientEn), ...strings(siteEn), ...strings(privacyEn), ...strings(termsEn)];
    expect(own.filter((s) => / [–—] /.test(s))).toEqual([]);
  });

  test('keeps the keys that are data, not words: the library categories and the areas', () => {
    expect(klientEn.resources.categories.map((c) => c.key)).toEqual(klientNo.resources.categories.map((c) => c.key));
    expect(briefEn.areas.map((a) => a.key)).toEqual(briefNo.areas.map((a) => a.key));
  });

  test('menus link to English addresses only', () => {
    for (const l of [...siteEn.links, ...siteEn.legal]) expect(langOf(l.href)).toBe('en');
    for (const l of [...siteNo.links, ...siteNo.legal]) expect(langOf(l.href)).toBe('no');
  });
});

describe('addresses in two languages', () => {
  test('every page has a twin, and the Norwegian site menu uses the table', () => {
    for (const p of Object.values(PATHS)) {
      expect(langOf(p.no)).toBe('no');
      expect(langOf(p.en)).toBe('en');
    }
    expect(siteNo.links.map((l) => l.href)).toEqual(siteEn.links.map((l) => counterpart(l.href, 'no')));
  });

  test.each([
    ['/', 'en', '/en'],
    ['/en', 'no', '/'],
    ['/om-oss', 'en', '/en/about-us'],
    ['/en/our-work', 'no', '/vart-arbeid'],
    ['/aktuelt', 'en', '/en/news-and-events'],
    ['/aktuelt/nyheter', 'en', '/en/news-and-events/news'],
    ['/aktuelt/arrangementer', 'en', '/en/news-and-events/events'],
    ['/aktuelt/nyheter/en-sak', 'en', '/en/news-and-events/news/en-sak'],
    ['/en/news-and-events/news/en-sak', 'no', '/aktuelt/nyheter/en-sak'],
    ['/personvern', 'en', '/en/privacy'],
    ['/en/terms/', 'no', '/vilkar'],
    ['/om-oss', 'no', '/om-oss'],
    ['/finnes-ikke', 'en', '/en'],
    ['/en/missing', 'no', '/'],
    ['/english', 'en', '/en'],
  ] as const)('%s in %s is %s', (from, to, want) => {
    expect(counterpart(from, to)).toBe(want);
  });

  test('a news item keeps its slug', () => {
    expect(newsItemPath('a-b', 'no')).toBe('/aktuelt/nyheter/a-b');
    expect(newsItemPath('a-b', 'en')).toBe('/en/news-and-events/news/a-b');
  });

  test('langOf does not take /english or /en-x for English', () => {
    expect(langOf('/english')).toBe('no');
    expect(langOf('/en')).toBe('en');
    expect(langOf('/en/x')).toBe('en');
  });
});
