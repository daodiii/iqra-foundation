import 'server-only';
import { editorEnabled, mayEdit, testEditor } from './access';

/** Who is asking: an editor, someone logged in who is not on the list, or nobody. */
export type Who = { kind: 'editor'; email: string } | { kind: 'denied'; email: string } | { kind: 'anon' };

/**
 * The person behind this request. The test editor when there is one (see `access.ts`);
 * otherwise Clerk's session, and the address must be on `EDITOR_EMAILS` as well.
 */
export async function currentEditor(): Promise<Who> {
  const test = testEditor();
  if (test) return { kind: 'editor', email: test };
  // Loaded only here, when the editor is configured, so Clerk never runs without its keys.
  const { currentUser } = await import('@clerk/nextjs/server');
  const user = await currentUser();
  if (!user) return { kind: 'anon' };
  // Only an address Clerk has verified counts: a sign-in method added later must not let someone claim an editor's address.
  const primary = user.primaryEmailAddress;
  const email = primary?.verification?.status === 'verified' ? primary.emailAddress.toLowerCase() : '';
  return mayEdit(email) ? { kind: 'editor', email } : { kind: 'denied', email };
}

/**
 * The gate for every route handler: the editor's address, or the response to send instead.
 * 404 when the editor is off here, 401 with no session, 403 for an address not on the list.
 */
export async function guard(): Promise<{ email: string } | Response> {
  if (!editorEnabled()) return new Response(null, { status: 404 });
  const who = await currentEditor();
  if (who.kind === 'anon') return Response.json({ error: 'Du må logge inn.' }, { status: 401 });
  if (who.kind === 'denied') return Response.json({ error: 'Du har ikke tilgang til redaksjonen.' }, { status: 403 });
  return { email: who.email };
}
