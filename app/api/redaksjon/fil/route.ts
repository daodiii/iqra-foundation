import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { guard } from '@/lib/redaksjon/session';
import { blobPath, extOf, fileMode, isStoredName, KINDS, type FileKind } from '@/lib/redaksjon/upload';

/**
 * A resource's PDF or video (`lib/redaksjon/upload.ts`). Every call passes the same gate as the
 * rest of the editor's API first: off is a 404, no session 401, an address off the list 403.
 *
 * - POST: Vercel Blob's client-upload handshake. The browser asks for a token for one pathname
 *   under `ressurser/`, gets one limited to that kind's types and size, and uploads straight to
 *   Blob. No completion callback is asked for, so nothing unauthenticated ever reaches this route.
 * - PUT `?kind=&name=`: under `next dev` and e2e, the bytes themselves, written into the
 *   checkout's `public/opplastet/ressurser/filer/`.
 */

const kindOf = (v: unknown): FileKind | null => (v === 'file' || v === 'video' ? v : null);

export async function POST(req: Request): Promise<Response> {
  const who = await guard();
  if (who instanceof Response) return who;
  if (fileMode() !== 'blob') return Response.json({ error: 'Opplasting av filer er ikke slått på.' }, { status: 503 });
  const { handleUpload } = await import('@vercel/blob/client');
  let body: Parameters<typeof handleUpload>[0]['body'];
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Ugyldig forespørsel.' }, { status: 400 });
  }
  if (body.type !== 'blob.generate-client-token') return Response.json({ error: 'Ugyldig forespørsel.' }, { status: 400 });
  try {
    const out = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, payload) => {
        const kind = kindOf(payload);
        const stored = pathname.startsWith('ressurser/') ? pathname.slice('ressurser/'.length) : '';
        if (!kind || !isStoredName(stored) || blobPath(stored) !== pathname || !KINDS[kind].ext.includes(extOf(stored))) {
          throw new Error('Ugyldig fil.');
        }
        return { allowedContentTypes: KINDS[kind].types, maximumSizeInBytes: KINDS[kind].max, addRandomSuffix: false, allowOverwrite: false };
      },
    });
    return Response.json(out);
  } catch (e) {
    console.error('[redaksjon] upload token', (e as Error).message);
    return Response.json({ error: 'Kunne ikke starte opplastingen. Prøv igjen.' }, { status: 400 });
  }
}

export async function PUT(req: Request): Promise<Response> {
  const who = await guard();
  if (who instanceof Response) return who;
  if (fileMode() !== 'local') return new Response(null, { status: 404 });
  const url = new URL(req.url);
  const kind = kindOf(url.searchParams.get('kind'));
  const name = url.searchParams.get('name') ?? '';
  if (!kind || !isStoredName(name) || !KINDS[kind].ext.includes(extOf(name))) return Response.json({ error: 'Ugyldig fil.' }, { status: 400 });
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > KINDS[kind].max) return Response.json({ error: 'Filen er tom eller for stor.' }, { status: 413 });
  const root = process.env.REDAKSJON_LOCAL_ROOT ?? process.cwd();
  const dir = path.join(/*turbopackIgnore: true*/ root, 'public', 'opplastet', 'ressurser', 'filer');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ dir, name), bytes);
  return Response.json({ url: `/opplastet/ressurser/filer/${name}` });
}
