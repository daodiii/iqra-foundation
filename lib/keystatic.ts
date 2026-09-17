/**
 * Whether the admin is served at all.
 *
 * Local mode writes files on the machine running `next dev`, so it works in development
 * and nowhere else: on Vercel there is no disk that survives the request, and an admin
 * that says «saved» and did not is worse than none. GitHub mode writes commits and works
 * anywhere, but only once the GitHub App exists and its variables are set. So: the admin
 * and its API answer in development, and in production only when GitHub mode is
 * configured; otherwise both are 404, and the public site never carries an editor that
 * cannot save.
 */
export function keystaticEnabled(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.KEYSTATIC_GITHUB_CLIENT_ID !== undefined;
}
