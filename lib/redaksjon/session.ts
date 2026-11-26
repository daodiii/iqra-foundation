import 'server-only';
import { cookies } from 'next/headers';
import { editorEnabled, mayEdit, testEditor } from './access';
import { SESSION_COOKIE, verifySession } from './kode';

/** Who is asking: an editor, someone logged in who is not on the list, or nobody. */
export type Who = { kind: 'editor'; email: string } | { kind: 'denied'; email: string } | { kind: 'anon' };

/**
 * The person behind this request. The test editor when there is one (see `access.ts`); otherwise
 * the signed session cookie the e-mail code gave (lib/redaksjon/kode.ts), and the address must still
 * be on `EDITOR_EMAILS`: taking someone off the list locks them out at their next request.
 */
export async function currentEditor(): Promise<Who> {
  const test = testEditor();
  if (test) return { kind: 'editor', email: test };
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const email = verifySession(token, Date.now(), process.env.REDAKSJON_SECRET);
  if (!email) return { kind: 'anon' };
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
