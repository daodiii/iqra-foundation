/**
 * The site's own address, absolute: for the share card, the canonical links, the sitemap and
 * robots.txt. Read from the environment rather than written down: the production host is a
 * Vercel-assigned name today and a real domain later, and a hardcoded one would keep pointing
 * at the old place long after it stopped being true. `VERCEL_PROJECT_PRODUCTION_URL` is the
 * production host on every deploy, preview builds included, which is what a canonical address
 * wants — never the per-deploy URL.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');
