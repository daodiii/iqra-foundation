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
