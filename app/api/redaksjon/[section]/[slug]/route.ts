import { deleteEntry, EditorError, openEntry, saveEntry } from '@/lib/redaksjon/entries';
import { readSave, route } from '@/lib/redaksjon/http';

type Ctx = RouteContext<'/api/redaksjon/[section]/[slug]'>;

/** One entry, with the version a save must send back. */
export async function GET(_req: Request, ctx: Ctx) {
  const { section, slug } = await ctx.params;
  return route(section, async ({ store, section }) => {
    const entry = await openEntry(store, section, slug);
    if (!entry) throw new EditorError(404, 'Finner ikke denne siden.');
    return Response.json(entry);
  });
}

/** A save over the entry (and a move, when the body names a new address). */
export async function PUT(req: Request, ctx: Ctx) {
  const { section, slug } = await ctx.params;
  return route(section, async ({ store, section, email }) => {
    const body = await readSave(req, section);
    return Response.json(await saveEntry(store, section, slug, body, email));
  });
}

/** Deletes the entry; `?version=` must be the one the editor saw. */
export async function DELETE(req: Request, ctx: Ctx) {
  const { section, slug } = await ctx.params;
  return route(section, async ({ store, section, email }) => {
    const version = new URL(req.url).searchParams.get('version') ?? '';
    await deleteEntry(store, section, slug, version, email);
    return new Response(null, { status: 204 });
  });
}
