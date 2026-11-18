import 'server-only';
import type { Store } from './files';
import { GitHubStore } from './github';
import { LocalStore } from './local';

export { assertPath, StaleError, type Change, type Store } from './files';

/**
 * Where the editor reads and writes the site's files. Two backends, one shape:
 *
 * - `GitHubStore` in production: reads `main` through GitHub's API and saves each change as one
 *   commit, which Vercel builds. The token lives only in server code.
 * - `LocalStore` under `next dev` and the e2e suite: this checkout's files, no token, no network.
 *
 * A file's `version` is a hash of its contents; the editor sends back the version it opened,
 * and a save over a file someone else has changed since is refused (`StaleError`).
 */

/**
 * The store for this environment, or null when the editor cannot save here: production without
 * a token. Development without a token writes this checkout.
 */
export function getStore(env: NodeJS.ProcessEnv = process.env): Store | null {
  const token = env.REDAKSJON_GITHUB_TOKEN;
  if (token) {
    const [owner, repo] = (env.REDAKSJON_REPO ?? 'daodiii/iqra-foundation').split('/');
    return new GitHubStore({ token, owner, repo, branch: env.REDAKSJON_BRANCH ?? 'main' });
  }
  if (env.NODE_ENV === 'production' && !env.REDAKSJON_LOCAL_ROOT) return null;
  return new LocalStore(env.REDAKSJON_LOCAL_ROOT ?? process.cwd());
}
