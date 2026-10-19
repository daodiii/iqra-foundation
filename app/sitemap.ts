import type { MetadataRoute } from 'next';
import { site } from '@/content/site.no';
import { siteUrl } from '@/lib/site-url';

/**
 * Every public page: the nine of the menu and the two legal pages. No `lastModified`: the pages are
 * built from content that changes by the hour, and a date that is only the build's would tell a
 * crawler nothing true. While the site is `noindex` (app/layout.tsx) a search engine will report
 * these as excluded; that is the intent until the real values land.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [...site.links, ...site.legal].map(({ href }) => ({
    url: href === '/' ? siteUrl : `${siteUrl}${href}`,
  }));
}
