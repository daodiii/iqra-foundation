/**
 * Whether the editor is on here, and who may use it. Read by `proxy.ts`, the editor's layout and
 * every route handler, so the three agree.
 *
 * On means one of:
 * - **Configured**: Clerk's two keys, a list of editor addresses (`EDITOR_EMAILS`), and somewhere
 *   to save (a GitHub token; under `next dev` this checkout will do).
 * - **The test editor**: `REDAKSJON_TEST_EDITOR` names an address that is logged in without Clerk,
 *   for `next dev` and the e2e suite. It is refused on Vercel, and in a production build unless
 *   the e2e suite says so (`REDAKSJON_E2E=1`), so a stray variable cannot open the editor.
 *
 * Otherwise the editor and its API are a 404, and Clerk is never loaded (its «keyless» mode would
 * otherwise call Clerk's servers to make a development instance).
 */

type Env = Record<string, string | undefined>;

export function testEditor(env: Env = process.env): string | null {
  const email = env.REDAKSJON_TEST_EDITOR?.trim().toLowerCase();
  if (!email || env.VERCEL) return null;
  if (env.NODE_ENV === 'production' && env.REDAKSJON_E2E !== '1') return null;
  return email;
}

export const clerkConfigured = (env: Env = process.env): boolean =>
  Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY);

/** The addresses that may edit, lower case. */
export function editorEmails(env: Env = process.env): Set<string> {
  return new Set((env.EDITOR_EMAILS ?? '').split(/[,\s]+/).map((e) => e.trim().toLowerCase()).filter((e) => e.includes('@')));
}

const canSave = (env: Env) => Boolean(env.REDAKSJON_GITHUB_TOKEN) || env.NODE_ENV !== 'production' || Boolean(env.REDAKSJON_LOCAL_ROOT);

export function editorEnabled(env: Env = process.env): boolean {
  if (testEditor(env)) return canSave(env);
  return clerkConfigured(env) && editorEmails(env).size > 0 && canSave(env);
}

/** Whether this address may edit. */
export const mayEdit = (email: string | null | undefined, env: Env = process.env): boolean =>
  Boolean(email) && editorEmails(env).has(email!.trim().toLowerCase());
