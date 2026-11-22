import type { MetadataRoute } from 'next';
import { counterpart } from '@/content/paths';
import { site } from '@/content/site.no';
import { siteUrl } from '@/lib/site-url';

const url = (href: string) => (href === '/' ? siteUrl : `${siteUrl}${href}`);

/**
 * Every public page: the nine of the menu and the two legal pages, the Norwegian ones first and then
 * their English twins (2026-11-22), each entry naming both languages. No `lastModified`: the pages are
 * built from content that changes by the hour, and a date that is only the build's would tell a
 * crawler nothing true. While the site is `noindex` (app/(no)/layout.tsx, app/en/layout.tsx) a search
 * engine will report these as excluded; that is the intent until the real values land.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Styringsdokumenter is a section of Ressurser now (`/ressurser#styringsdokumenter`); a sitemap lists pages, not places on them.
  const pages = [...site.links, ...site.legal].filter(({ href }) => !href.includes('#')).map(({ href }) => href);
  const entry = (no: string, href: string) => ({ url: url(href), alternates: { languages: { nb: url(no), en: url(counterpart(no, 'en')) } } });
  return [...pages.map((no) => entry(no, no)), ...pages.map((no) => entry(no, counterpart(no, 'en')))];
}
