/**
 * The foundation's own domain (the owner, 2026-11-19): the site's address once it is live there.
 */
export const DOMAIN = 'iqrasti.no';

/**
 * The site's own address, absolute: for the share card, the canonical links, the sitemap and
 * robots.txt. `NEXT_PUBLIC_SITE_URL` overrides everything. The production deploy is
 * https://iqrasti.no. Every other Vercel build (the previews) uses `VERCEL_PROJECT_PRODUCTION_URL`,
 * the project's production host, never the per-deploy URL. A local build is localhost.
 *
 * The production share card, canonical links and sitemap point at iqrasti.no from the first
 * deploy with this file, so the domain has to reach Vercel before this ships.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_ENV === 'production'
    ? `https://${DOMAIN}`
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000');
