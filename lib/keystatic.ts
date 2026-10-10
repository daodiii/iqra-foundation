/**
 * Whether the admin is served at all.
 *
 * Local mode writes files on the machine running `next dev`, so it works in development
 * and nowhere else: on Vercel there is no disk that survives the request, and an admin
 * that says «saved» and did not is worse than none. GitHub mode writes commits and works
 * anywhere, but only once it is switched on (`NEXT_PUBLIC_KEYSTATIC_STORAGE=github`, which
 * `keystatic.config.ts` reads) and the GitHub App's variables are set. So: the admin and its
 * API answer in development, and in production only when both are there; otherwise both are
 * 404, and the public site never carries an editor that cannot save.
 */
export function keystaticEnabled(): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  return process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === 'github' && Boolean(process.env.KEYSTATIC_GITHUB_CLIENT_ID);
}
