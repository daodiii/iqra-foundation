import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';

/**
 * Crawlers may read every public page; the content editor and its API are not for them. The site
 * has been open to search since 2026-11-25 (no `noindex` in the root layouts).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/keystatic', '/api/'] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
