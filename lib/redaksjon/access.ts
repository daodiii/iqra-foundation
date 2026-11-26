/**
 * Whether the editor is on here, and who may use it. Read by `proxy.ts`, the editor's layout and
 * every route handler, so the three agree.
 *
 * On means one of:
 * - **Configured**: the login (a secret to sign its cookies, `REDAKSJON_SECRET`, and the site's
 *   mailbox to send the codes, `SMTP_USER`/`SMTP_PASS`: lib/redaksjon/kode.ts), a list of editor
 *   addresses (`EDITOR_EMAILS`), and somewhere to save (a GitHub token; under `next dev` this
 *   checkout will do).
 * - **The test editor**: `REDAKSJON_TEST_EDITOR` names an address that is logged in without a code,
 *   for `next dev` and the e2e suite. It is refused on Vercel, and in a production build unless
 *   the e2e suite says so (`REDAKSJON_E2E=1`), so a stray variable cannot open the editor.
 *
 * Otherwise the editor and its API are a 404.
 */

type Env = Record<string, string | undefined>;

export function testEditor(env: Env = process.env): string | null {
  const email = env.REDAKSJON_TEST_EDITOR?.trim().toLowerCase();
  if (!email || env.VERCEL) return null;
  if (env.NODE_ENV === 'production' && env.REDAKSJON_E2E !== '1') return null;
  return email;
}

/** The e-mail login can work: a secret of at least 32 characters, and the mailbox to send from. */
export const loginConfigured = (env: Env = process.env): boolean =>
  (env.REDAKSJON_SECRET?.length ?? 0) >= 32 && Boolean(env.SMTP_USER?.trim() && env.SMTP_PASS?.trim());

/** The addresses that may edit, lower case. */
export function editorEmails(env: Env = process.env): Set<string> {
  return new Set((env.EDITOR_EMAILS ?? '').split(/[,\s]+/).map((e) => e.trim().toLowerCase()).filter((e) => e.includes('@')));
}

const canSave = (env: Env) => Boolean(env.REDAKSJON_GITHUB_TOKEN) || env.NODE_ENV !== 'production' || Boolean(env.REDAKSJON_LOCAL_ROOT);

export function editorEnabled(env: Env = process.env): boolean {
  if (testEditor(env)) return canSave(env);
  return loginConfigured(env) && editorEmails(env).size > 0 && canSave(env);
}

/** Whether this address may edit. */
export const mayEdit = (email: string | null | undefined, env: Env = process.env): boolean =>
  Boolean(email) && editorEmails(env).has(email!.trim().toLowerCase());
