import { createEntry, listEntries } from '@/lib/redaksjon/entries';
import { readSave, route } from '@/lib/redaksjon/http';

/** A section's entries, newest first. */
export async function GET(_req: Request, ctx: RouteContext<'/api/redaksjon/[section]'>) {
  const { section } = await ctx.params;
  return route(section, async ({ store, section }) => Response.json({ entries: await listEntries(store, section) }));
}

/** A new entry. */
export async function POST(req: Request, ctx: RouteContext<'/api/redaksjon/[section]'>) {
  const { section } = await ctx.params;
  return route(section, async ({ store, section, email }) => {
    const { fields, slug, uploads } = await readSave(req, section);
    return Response.json(await createEntry(store, section, { fields, slug, uploads }, email), { status: 201 });
  });
}
