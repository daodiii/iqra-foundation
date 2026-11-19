import 'server-only';
import { EditorError, type Upload } from './entries';
import { StaleError, type Store } from './files';
import { GitHubError } from './github';
import { coerce, isSection, isSlug, type EntryOf, type Section } from './schema';
import { guard } from './session';
import { getStore } from './store';

/**
 * The plumbing every editor route shares: the gate, the store, reading the body, and turning a
 * refusal into an answer the editor can show as it is.
 */

type Ctx = { email: string; store: Store; section: Section };

/** Runs a route after the gate, with the store and a checked section; answers every refusal. */
export async function route(section: string, run: (c: Ctx) => Promise<Response>): Promise<Response> {
  const who = await guard();
  if (who instanceof Response) return who;
  if (!isSection(section)) return Response.json({ error: 'Finnes ikke.' }, { status: 404 });
  const store = getStore();
  if (!store) return new Response(null, { status: 404 });
  try {
    return await run({ email: who.email, store, section });
  } catch (e) {
    return refusal(e);
  }
}

export function refusal(e: unknown): Response {
  if (e instanceof EditorError) return Response.json({ error: e.message, fields: e.fields ?? [] }, { status: e.status });
  if (e instanceof StaleError) {
    return Response.json({ error: 'Noen andre har endret denne siden etter at du åpnet den. Last den inn på nytt før du lagrer.' }, { status: 409 });
  }
  if (e instanceof GitHubError) {
    console.error('[redaksjon]', e.message);
    return Response.json({ error: 'Kunne ikke lagre akkurat nå. Teksten din er ikke borte; prøv igjen om litt.' }, { status: 502 });
  }
  console.error('[redaksjon]', e);
  return Response.json({ error: 'Noe gikk galt. Teksten din er ikke borte; prøv igjen.' }, { status: 500 });
}

/** The body of a save: the fields, the version opened, an address, and pictures (base64). */
export async function readSave<S extends Section>(
  req: Request, section: S,
): Promise<{ fields: EntryOf[S]; version: string; slug?: string; uploads: Upload[] }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new EditorError(400, 'Kunne ikke lese det som ble sendt.');
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new EditorError(400, 'Kunne ikke lese det som ble sendt.');
  const b = raw as Record<string, unknown>;
  const f = b.fields && typeof b.fields === 'object' ? (b.fields as Record<string, unknown>) : {};
  const fields = coerce(section, f, typeof f.body === 'string' ? f.body : '');
  if (b.slug !== undefined && !isSlug(b.slug)) {
    throw new EditorError(422, 'Nettadressen kan bare ha små bokstaver, tall og bindestrek.', [{ key: 'slug', text: 'Nettadresse' }]);
  }
  const uploads: Upload[] = Array.isArray(b.uploads)
    ? b.uploads.map((u) => {
        const o = (u ?? {}) as Record<string, unknown>;
        if (typeof o.name !== 'string' || typeof o.data !== 'string') throw new EditorError(400, 'Et bilde kom ikke fram. Prøv igjen.');
        return { name: o.name, bytes: new Uint8Array(Buffer.from(o.data, 'base64')) };
      })
    : [];
  return { fields, version: typeof b.version === 'string' ? b.version : '', slug: b.slug as string | undefined, uploads };
}
