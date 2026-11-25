import { describe, expect, test } from 'vitest';
import { pageMeta } from '@/lib/meta';
import { SEO } from './seo';

describe('SEO: what a search engine shows for each page', () => {
  test('a title of at most 60 characters, the name once; a description of 70–160; none repeated within a language', () => {
    for (const lang of ['no', 'en'] as const) {
      const all = Object.values(SEO[lang]);
      for (const { title, description } of all) {
        expect(title.length, title).toBeLessThanOrEqual(60);
        expect(title.match(/Iqra Foundation/g), title).toHaveLength(1);
        expect(description.length, description).toBeGreaterThanOrEqual(70);
        expect(description.length, description).toBeLessThanOrEqual(160);
      }
      expect(new Set(all.map((s) => s.title)).size).toBe(all.length);
      expect(new Set(all.map((s) => s.description)).size).toBe(all.length);
    }
  });

  test('pageMeta uses them whole, past the layout’s title template, and keeps the page’s own where there is none', () => {
    const m = pageMeta('contact', 'no', { title: 'Kontakt', description: 'Sidens egen tekst' });
    expect(m.title).toEqual({ absolute: 'Kontakt oss – Iqra Foundation' });
    expect(m.description).toBe(SEO.no.contact!.description);
    expect(pageMeta('home', 'en').title).toEqual({ absolute: SEO.en.home!.title });
    const legal = pageMeta('privacy', 'no', { title: 'Personvern', description: 'Om personvern.' });
    expect(legal).toMatchObject({ title: 'Personvern', description: 'Om personvern.' });
  });
});
