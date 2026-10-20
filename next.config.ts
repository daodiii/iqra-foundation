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
  async headers() {
    return [
      { source: '/((?!keystatic|api/keystatic).*)', headers: securityHeaders },
      {
        source: '/media/:file*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  /*
   * News lives on Arrangementer (the owner, 2026-10-10); a news item's own page is
   * /nyheter/<slug>, so /nyheter alone goes to where the news stands.
   */
  async redirects() {
    return [{ source: '/nyheter', destination: '/arrangementer#nyheter', permanent: false }];
  },
};

export default nextConfig;
