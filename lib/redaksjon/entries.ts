import 'server-only';
import {
  CATEGORIES, entryPaths, fromFiles, isSlug, LABELS, problems, slugify, slugOf, titleOf, toFiles,
  type EntryOf, type Section,
} from './schema';
import { COLLECTIONS } from '@/content/collections';
import { StaleError, type Change, type Store } from './files';

/**
 * What the editor does with an entry, over any store: list, open, create, save, delete. The
 * route handlers and the editor's server pages both call these, so the checks live in one place.
 */

/** One row in a list: enough for «Siste innlegg» and the section lists. */
export type Row = { section: Section; slug: string; title: string; sub: string; date: string; draft: boolean };

/** An entry as the editor opens it, with the version a later save must send back. */
export type Opened<S extends Section> = { section: S; slug: string; fields: EntryOf[S]; version: string };

/** A picture uploaded with a save: a plain file name and its bytes. */
export type Upload = { name: string; bytes: Uint8Array };

/** A refusal the editor can show as it is: the status to answer with and the words. */
export class EditorError extends Error {
  constructor(public status: number, message: string, public fields?: { key: string; text: string }[]) {
    super(message);
  }
}

const dateOf = (section: Section, f: Record<string, unknown>): string =>
  String((section === 'arrangementer' ? f.start : f.date) ?? '');

/** The line under a row's title: the ingress, the description, the category and kind, the role. */
function subOf(section: Section, f: Record<string, unknown>): string {
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  if (section === 'nyheter') return str(f.summary);
  if (section === 'arrangementer') return str(f.text);
  if (section === 'menneskene') return str(f.role);
  const cat = CATEGORIES.find((c) => c.key === f.category)?.label ?? '';
  const kind = f.file ? (/\.pdf$/i.test(str(f.file)) ? 'PDF' : 'Fil') : f.video ? 'Video' : f.url ? 'Lenke' : '';
  return [cat, kind].filter(Boolean).join(' · ');
}

/** Every entry in a section, newest first (people in their running order). */
export async function listEntries(store: Store, section: Section): Promise<Row[]> {
  const slugs = (await store.list(COLLECTIONS[section].dir)).map((p) => slugOf(section, p)).filter((s): s is string => s !== null);
  const rows = await Promise.all(
    slugs.map(async (slug): Promise<(Row & { order: number }) | null> => {
      const opened = await openEntry(store, section, slug).catch(() => null);
      if (!opened) return null;
      const f = opened.fields as Record<string, unknown>;
      return {
        section, slug, title: titleOf(section, opened.fields) || slug, sub: subOf(section, f), date: dateOf(section, f),
        draft: section === 'nyheter' && f.publish !== true, order: typeof f.order === 'number' ? f.order : 0,
      };
    }),
  );
  const ok = rows.filter((r): r is Row & { order: number } => r !== null);
  if (section === 'menneskene') ok.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'nb'));
  else ok.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'nb'));
  return ok.map((r) => ({ section: r.section, slug: r.slug, title: r.title, sub: r.sub, date: r.date, draft: r.draft }));
}

/** The version of an entry: its files' versions together, so a change to either one counts. */
async function readAll(store: Store, section: Section, slug: string) {
  if (!isSlug(slug)) throw new EditorError(404, 'Finner ikke denne siden.');
  const paths = entryPaths(section, slug);
  const got = await Promise.all(paths.map((p) => store.read(p)));
  const files: Record<string, string | null> = {};
  paths.forEach((p, i) => { files[p] = got[i]?.text ?? null; });
  const exists = got[0] !== null;
  return { files, exists, version: got.map((g) => g?.version ?? '-').join('.') };
}

export async function openEntry<S extends Section>(store: Store, section: S, slug: string): Promise<Opened<S> | null> {
  if (!isSlug(slug)) return null;
  const { files, exists, version } = await readAll(store, section, slug);
  if (!exists) return null;
  return { section, slug, fields: fromFiles(section, slug, files).fields, version };
}

/* ----- writing ----- */

const PIC_NAME = /^[a-z0-9][a-z0-9-]{0,79}\.(webp|jpg|jpeg|png)$/;
const MAX_PIC = 3 * 1024 * 1024;

/** The bytes really are the picture the name says: WebP, JPEG or PNG. */
function looksLike(name: string, b: Uint8Array): boolean {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (name.endsWith('.webp')) return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
  if (name.endsWith('.png')) return b[0] === 0x89 && ascii(1, 4) === 'PNG';
  return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
}

/** Where a section's uploaded pictures go, repo path and public path. */
export const uploadDir = (section: Section, slug: string) => ({
  repo: `public/opplastet/${section}/${slug}`,
  web: `/opplastet/${section}/${slug}`,
});

function uploadChanges(section: Section, slug: string, uploads: Upload[]): Change[] {
  return uploads.map((u) => {
    if (!PIC_NAME.test(u.name)) throw new EditorError(400, `Ugyldig filnavn på bildet: ${u.name}`);
    if (u.bytes.byteLength > MAX_PIC) throw new EditorError(413, 'Bildet er for stort. Prøv et mindre bilde.');
    if (!looksLike(u.name, u.bytes)) throw new EditorError(400, 'Filen er ikke et bilde.');
    return { path: `${uploadDir(section, slug).repo}/${u.name}`, bytes: u.bytes };
  });
}

/** «ny» is the address of the editor's empty sheet, so no post may have it. */
function usable(slug: string) {
  if (!isSlug(slug)) throw new EditorError(422, 'Nettadressen kan bare ha små bokstaver, tall og bindestrek.', [{ key: 'slug', text: 'Nettadresse' }]);
  if (slug === 'ny') throw new EditorError(409, 'Nettadressen «ny» er opptatt. Velg en annen.', [{ key: 'slug', text: 'Nettadresse' }]);
}

function check<S extends Section>(section: S, fields: EntryOf[S]) {
  const p = problems(section, fields);
  if (p.length) throw new EditorError(422, `Mangler: ${p.map((x) => x.text).join(', ')}.`, p);
}

/** The commit message: «Nyhet: <title> (<email>)», «Slettet nyhet: …» for a delete. */
const message = (section: Section, title: string, email: string, deleted = false) =>
  `${deleted ? `Slettet ${LABELS[section].one.toLowerCase()}` : LABELS[section].one}: ${title} (${email})`;

/** What the editor says after a save. */
function note(section: Section, fields: Record<string, unknown>): string {
  if (section === 'nyheter' && fields.publish !== true) return 'Lagret som utkast. Den vises ikke på nettsiden.';
  return 'Lagret. Synlig på nettsiden om 2–3 minutter.';
}

export type Saved = { slug: string; version: string; note: string };

/** A new entry. Its address comes from the title unless one is given; an address in use is refused. */
export async function createEntry<S extends Section>(
  store: Store, section: S, input: { fields: EntryOf[S]; slug?: string; uploads?: Upload[] }, email: string,
): Promise<Saved> {
  check(section, input.fields);
  const slug = input.slug ?? slugify(titleOf(section, input.fields));
  usable(slug);
  if ((await readAll(store, section, slug)).exists) {
    throw new EditorError(409, 'En annen nyhet har allerede denne nettadressen. Endre overskriften eller adressen.', [{ key: 'slug', text: 'Nettadresse' }]);
  }
  const files = toFiles(section, slug, { fields: input.fields, extra: {} });
  const changes: Change[] = [
    ...uploadChanges(section, slug, input.uploads ?? []),
    ...Object.entries(files).map(([path, text]) => ({ path, text })),
  ];
  await store.commit(changes, message(section, titleOf(section, input.fields), email));
  const after = await readAll(store, section, slug);
  return { slug, version: after.version, note: note(section, input.fields as Record<string, unknown>) };
}

/**
 * A save over an existing entry. `version` is what the editor opened; if the files changed since,
 * nothing is written. A new `slug` moves the entry (its old files go in the same commit). Keys the
 * editor does not know are taken from the files as they are now, never from the browser.
 */
export async function saveEntry<S extends Section>(
  store: Store, section: S, slug: string,
  input: { fields: EntryOf[S]; version: string; slug?: string; uploads?: Upload[] }, email: string,
): Promise<Saved> {
  check(section, input.fields);
  const now = await readAll(store, section, slug);
  if (!now.exists) throw new EditorError(404, 'Finner ikke denne siden. Den kan være slettet.');
  if (now.version !== input.version) throw new StaleError(entryPaths(section, slug)[0]);
  const to = input.slug ?? slug;
  if (to !== slug) usable(to);
  if (to !== slug && (await readAll(store, section, to)).exists) {
    throw new EditorError(409, 'En annen nyhet har allerede denne nettadressen. Endre overskriften eller adressen.', [{ key: 'slug', text: 'Nettadresse' }]);
  }
  const { extra } = fromFiles(section, slug, now.files);
  const files = toFiles(section, to, { fields: input.fields, extra });
  const changes: Change[] = [
    ...uploadChanges(section, to, input.uploads ?? []),
    ...Object.entries(files).map(([path, text]) => ({ path, text })),
  ];
  if (to !== slug) for (const p of entryPaths(section, slug)) if (now.files[p] !== null) changes.push({ path: p, remove: true });
  await store.commit(changes, message(section, titleOf(section, input.fields), email));
  const after = await readAll(store, section, to);
  return { slug: to, version: after.version, note: note(section, input.fields as Record<string, unknown>) };
}

/** Removes an entry's files in one commit, if it is still the version the editor saw. */
export async function deleteEntry(store: Store, section: Section, slug: string, version: string, email: string): Promise<void> {
  const now = await readAll(store, section, slug);
  if (!now.exists) throw new EditorError(404, 'Finner ikke denne siden. Den kan allerede være slettet.');
  if (now.version !== version) throw new StaleError(entryPaths(section, slug)[0]);
  const title = titleOf(section, fromFiles(section, slug, now.files).fields) || slug;
  const changes: Change[] = entryPaths(section, slug).filter((p) => now.files[p] !== null).map((path) => ({ path, remove: true }));
  await store.commit(changes, message(section, title, email, true));
}
