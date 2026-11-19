import type { NextConfig } from "next";

/**
 * The headers every public page goes out with.
 *
 * HTTPS is forced twice over: Vercel answers every plain-http request with a redirect to
 * https, and `Strict-Transport-Security` tells the browser not to try http again for two
 * years (no `preload`: that is a promise to browsers' lists which is hard to take back, and
 * the owner has not asked for it). The rest is the usual hardening: no sniffing of types,
 * no framing of the site by others, nothing sent to other sites beyond the origin, and no
 * camera, microphone or location (the site asks for none).
 *
 * The content policy names where things may come from: this site only. `unsafe-inline` is
 * the price of a static Next site, whose own bootstrap script is inline and cannot carry a
 * per-request nonce without making every page dynamic; the policy still shuts the door on
 * scripts, frames, plug-ins and form posts from anywhere else. Not applied to the content
 * editor under /keystatic, which loads GitHub's own scripts and talks to its API.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

/**
 * The editor under /redaksjon logs in through Clerk, whose scripts and API live at the
 * instance's own address. That address is written into the publishable key (base64 after
 * `pk_test_` / `pk_live_`, ending in `$`), so the policy names exactly that host and no wildcard.
 * Cloudflare's check is Clerk's bot protection on sign-in.
 */
function clerkHost(key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''): string | null {
  const m = /^pk_(?:test|live)_([A-Za-z0-9+/=]+)$/.exec(key);
  if (!m) return null;
  const host = Buffer.from(m[1], 'base64').toString('utf8').replace(/\$$/, '');
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host) ? host : null;
}
const clerk = clerkHost();
const editorCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}${clerk ? ` https://${clerk} https://challenges.cloudflare.com` : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${clerk ? ' https://img.clerk.com' : ''}`,
  "font-src 'self' data:",
  `connect-src 'self'${clerk ? ` https://${clerk}` : ''}`,
  `frame-src${clerk ? ' https://challenges.cloudflare.com' : " 'none'"}`,
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Content-Security-Policy', value: csp },
];

const nextConfig: NextConfig = {
  /** The server does not announce what it is made of. */
  poweredByHeader: false,
  /** Visit counting runs on the production deploy only (components/site/Analytics.tsx). */
  env: { NEXT_PUBLIC_ANALYTICS: process.env.VERCEL_ENV === 'production' ? '1' : '' },
  /*
   * The home page and Arrangementer regenerate hourly (`revalidate`), and at that moment
   * they read the collections from disk — `lib/content.ts` joins `process.cwd()` with the
   * collection's folder, a path the file tracer cannot follow, so the records are named
   * here or the regenerated page would find no files and quietly keep the stale one.
   */
  outputFileTracingIncludes: {
    '/': ['./content/**/*'],
    '/arrangementer': ['./content/**/*'],
  },
  /*
   * Everything under /media is a build artefact of the film and the stills, and it is
   * heavy: the 720p loop alone is 470KB. Vercel serves /public with
   * `max-age=0, must-revalidate`, so every visit re-validated all of it.
   *
   * A year, immutable: the files are named for the film (`lib/media.ts` FILM), and a new
   * film is a new name, so nothing under an old name ever changes. The month without
   * `immutable` that stood here was no protection — a browser does not revalidate inside
   * `max-age` either, and when the second film went out under the first one's names
   * (2026-09-20) a returning visitor kept seeing the first for a month.
   */
  /**
   * Styringsdokumenter is a category of the library now (the client's message, point 5,
   * 2026-11-18), not a page of its own; the old address lands on it.
   */
  async redirects() {
    return [
      { source: '/styringsdokumenter', destination: '/ressurser#styringsdokumenter', permanent: true },
      // News and events are one page now, Aktuelt (the client's message, point 3).
      { source: '/arrangementer', destination: '/aktuelt/arrangementer', permanent: true },
      { source: '/nyheter', destination: '/aktuelt/nyheter', permanent: true },
    ];
  },
  async headers() {
    return [
      { source: '/((?!keystatic|api/keystatic|redaksjon|api/redaksjon).*)', headers: securityHeaders },
      {
        source: '/:dir(redaksjon|api/redaksjon)/:rest*',
        headers: [
          ...securityHeaders.filter((h) => h.key !== 'Content-Security-Policy'),
          { key: 'Content-Security-Policy', value: editorCsp },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
      {
        source: '/media/:file*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
