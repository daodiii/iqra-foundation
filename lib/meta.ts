import type { Metadata } from 'next';
import { PATHS, type Lang, type PageKey } from '@/content/paths';
import { SEO } from '@/content/seo';

/**
 * A page's metadata in its language: its title and description, its own address as canonical, and
 * its twin in the other language as an `hreflang` alternate (2026-11-22), so a search engine shows
 * each reader the language they read. Norwegian is the default (`x-default`): the foundation is
 * Norwegian and so is most of its audience.
 */
export function alternates(no: string, en: string, lang: Lang): NonNullable<Metadata['alternates']> {
  return {
    canonical: lang === 'en' ? en : no,
    languages: { nb: no, en, 'x-default': no },
  };
}

/**
 * The search engine's title and description come from `content/seo.ts` where a page has them (whole,
 * past the layout's «– Iqra Foundation» template); `text` is the page's own and stands where it has none.
 */
export function pageMeta(page: PageKey, lang: Lang, text: { title?: string; description?: string } = {}): Metadata {
  const seo = SEO[lang][page];
  const own = seo ? { title: { absolute: seo.title }, description: seo.description } : text;
  return { ...own, alternates: alternates(PATHS[page].no, PATHS[page].en, lang) };
}
