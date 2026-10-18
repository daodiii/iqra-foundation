import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';

/**
 * Crawlers may read every public page; the content editor and its API are not for them. There is
 * deliberately no blanket «Disallow: /» while the site is `noindex` (app/layout.tsx): that tag only
 * works if the crawler is allowed to fetch the page and read it. When the real values land and the
 * `robots` field there is deleted, this file needs no change.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/keystatic', '/api/'] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
