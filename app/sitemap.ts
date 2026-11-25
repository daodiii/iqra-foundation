import type { MetadataRoute } from 'next';
import { counterpart, newsItemPath, PATHS } from '@/content/paths';
import { site } from '@/content/site.no';
import { getNews } from '@/lib/content';
import { siteUrl } from '@/lib/site-url';

const url = (href: string) => (href === '/' ? siteUrl : `${siteUrl}${href}`);

/**
 * Every public page: the nine of the menu and the two legal pages, then the events archive, the
 * Norwegian ones first and then their English twins (2026-11-22), each entry naming both languages and
 * the default, as the pages' own `hreflang` does. Then each news item that has a page (an article
 * text), at its Norwegian address alone: articles are written in Norwegian, and the English page
 * names the Norwegian one as canonical (SEO audit, second run, 2026-11-25).
 *
 * A page gets no `lastModified`: it is built from content that changes by the hour, and a date that is
 * only the build's would tell a crawler nothing true. A news item gets its own date (2026-11-25, from
 * the SEO audit), which is when it was written.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Styringsdokumenter is a section of Ressurser now (`/ressurser#styringsdokumenter`); a sitemap lists pages, not places on them.
  const pages = [...site.links, ...site.legal].filter(({ href }) => !href.includes('#')).map(({ href }) => href);
  pages.push(PATHS.archive.no);
  const languages = (no: string, en: string) => ({ nb: url(no), en: url(en), 'x-default': url(no) });
  const entry = (no: string, href: string) => ({ url: url(href), alternates: { languages: languages(no, counterpart(no, 'en')) } });
  const news = getNews()
    .filter((n) => n.body)
    .map(({ slug, date }) => {
      const no = url(newsItemPath(slug, 'no'));
      return { url: no, lastModified: date, alternates: { languages: { nb: no, 'x-default': no } } };
    });
  return [...pages.map((no) => entry(no, no)), ...pages.map((no) => entry(no, counterpart(no, 'en'))), ...news];
}
