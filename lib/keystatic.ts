/** The GitHub App's three values; Keystatic's API needs every one of them outside development. */
const GITHUB_APP = ['KEYSTATIC_GITHUB_CLIENT_ID', 'KEYSTATIC_GITHUB_CLIENT_SECRET', 'KEYSTATIC_SECRET'] as const;

/**
 * Whether the admin is served at all.
 *
 * Local mode writes files on the machine running `next dev`, so it works in development
 * and nowhere else: on Vercel there is no disk that survives the request, and an admin
 * that says «saved» and did not is worse than none. GitHub mode writes commits and works
 * anywhere, but only once it is switched on (`NEXT_PUBLIC_KEYSTATIC_STORAGE=github`, which
 * `keystatic.config.ts` reads) and all three of the GitHub App's values are set:
 * `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET` and `KEYSTATIC_SECRET`.
 * So: the admin and its API answer in development, and in production only when the mode and
 * all three are there; otherwise both are 404, and the public site never carries an editor
 * that cannot save. A half-finished setup has to be a 404 and not a crash: in GitHub mode
 * with any of the three missing, Keystatic's route handler throws as it is made, and
 * `next build` makes it while collecting page data, so every build would fail.
 */
export function keystaticEnabled(): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  return process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === 'github' && GITHUB_APP.every((key) => Boolean(process.env[key]));
}
