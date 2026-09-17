import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
   * heavy: the 720p loop alone is 660KB. Vercel serves /public with
   * `max-age=0, must-revalidate`, so every visit re-validated all of it.
   *
   * A month, and deliberately not `immutable`: these filenames carry no content hash,
   * so a re-cut of the film keeps its name, and `immutable` would strand returning
   * visitors on the old one until they hard-refreshed. `stale-while-revalidate` lets
   * the change land on the visit after the one that finds it.
   */
  async headers() {
    return [
      {
        source: '/media/:file*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
};

export default nextConfig;
