import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { brief } from '@/content/brief.no';
import { COLLECTIONS, type CollectionName } from '@/content/collections';

/**
 * The one door the pages read the collections through.
 *
 * Everything that changes over time — events, news, resources, governing documents, people —
 * is a typed collection under `content/<collection>/`, in the shape `content/collections.ts`
 * declares and Keystatic (`keystatic.config.ts`) writes. The three kinds of post (arrangementer,
 * nyheter, ressurser) are a folder each — `<slug>/index.json`, and `<slug>/body.mdoc` when there
 * is a full text — and are read only when ticked «Publiser»; menneskene and styringsdokumenter
 * are one `<slug>.json` each. Pages never read files themselves; they call `getEvents()` and the
 * rest, which read, check and sort.
 *
 * A record that is not what its type says is left out and named in a warning in the build log,
 * with its file and the field, and the rest are read: editors save straight to `main`, and one
 * bad save must not stop every later one from reaching the site. `lib/content.real.test.ts`
 * holds the real content to having no such record, so our own mistakes still fail the tests.
 */

/** One picture with its words: one field, so a photograph cannot arrive without an alt. */
export type Picture = { src: string; alt: string };

/** The four areas' keys, from the brief; a post may carry one. */
export const AREA_KEYS = brief.areas.map((a) => a.key) as readonly AreaKey[];
export type AreaKey = (typeof brief.areas)[number]['key'];

/** What every post — an event, a news item, a resource — carries. */
export type PostFields = {
  slug: string;
  title: string;
  /** The short text on the card and in the list. */
  summary: string;
  image: Picture | null;
  /** One of the four areas, when the post belongs to one. */
  area: AreaKey | null;
  /** The full text as Keystatic writes it (Markdoc), when there is one; a post with one has a page of its own. */
  body: string | null;
};

export type Event = PostFields & {
  /** ISO date, `YYYY-MM-DD`; written out on the page. */
  start: string;
  /** `HH:MM`, when there is one. */
  time: string | null;
  /** ISO date; for an event over more than one day. */
  end: string | null;
  place: string;
  /** Sign-up or more information. */
  link: string | null;
};

export type NewsItem = PostFields & {
  /** ISO date. */
  date: string;
};

export type ResourceKind = 'publikasjon' | 'artikkel' | 'rapport' | 'presentasjon' | 'video' | 'annet';
export type Resource = PostFields & {
  kind: ResourceKind;
  /** ISO date. */
  date: string;
  /** A file under `public/`, as its public path; or a URL elsewhere; or neither, when the full text is the resource. */
  file: string | null;
  url: string | null;
};

export type DocumentKind = 'vedtekter' | 'arsrapport' | 'arsregnskap' | 'strategi' | 'annet';
export type GoverningDocument = {
  slug: string;
  title: string;
  kind: DocumentKind;
  year: number;
  /** A file under `public/`, as its public path. */
  file: string;
};

export type Person = {
  slug: string;
  name: string;
  role: string;
  photo: Picture | null;
  bio: string;
  /** Where in the list; lower first. */
  order: number;
};

export const RESOURCE_KINDS: readonly ResourceKind[] = ['publikasjon', 'artikkel', 'rapport', 'presentasjon', 'video', 'annet'];
export const DOCUMENT_KINDS: readonly DocumentKind[] = ['vedtekter', 'arsrapport', 'arsregnskap', 'strategi', 'annet'];

/* ----- reading ----- */

/**
 * Where a collection's files are. `content/<name>` under the project root, written as a
 * static prefix and a name, so the build traces only `content/` into the server bundle
 * rather than the whole project; the tests hand the readers a fixture directory instead.
 */
const collectionDir = (name: CollectionName) => path.join(process.cwd(), 'content', COLLECTIONS[name].folder);

type Raw = Record<string, unknown>;

class RecordError extends Error {
  constructor(file: string, message: string) {
    super(`${file}: ${message}`);
  }
}

/** Where a left-out record is reported: the build log, unless the caller (a test) listens itself. */
export type Skip = (problem: string) => void;
const warn: Skip = (problem) => console.warn(`[innhold] hoppet over ${problem}`);

/** One entry as it lies on disk: its slug, its record's file (for messages), the record, and its full text if any. */
type Entry = { file: string; slug: string; raw: Raw; body: string | null };

/**
 * A collection's entries in slug order. A folder collection's entry is a folder holding an
 * `index.json` (its README, or a folder without a record, is not an entry); a flat
 * collection's is a `.json` file. A record that is not a JSON object is reported and left out.
 */
function readCollection(name: CollectionName, dir: string, skip: Skip): Entry[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return []; // no directory yet is the same as an empty one
  }
  const folder = COLLECTIONS[name].layout === 'folder';
  const entries: Entry[] = [];
  for (const n of names.sort()) {
    const slug = folder ? n : n.endsWith('.json') ? n.slice(0, -'.json'.length) : null;
    if (slug === null) continue;
    const at = folder ? path.join(dir, n, 'index.json') : path.join(dir, n);
    if (folder && !existsSync(at)) continue;
    const file = folder ? `${COLLECTIONS[name].dir}/${n}/index.json` : `${COLLECTIONS[name].dir}/${n}`;
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(at, 'utf8'));
    } catch (e) {
      skip(`${file}: is not valid JSON (${(e as Error).message})`);
      continue;
    }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      skip(`${file}: is not an object`);
      continue;
    }
    const bodyAt = path.join(dir, n, 'body.mdoc');
    const text = folder && existsSync(bodyAt) ? readFileSync(bodyAt, 'utf8') : '';
    entries.push({ file, slug, raw: raw as Raw, body: text.trim() ? text : null });
  }
  return entries;
}

/** Each entry through its reader; a record the reader refuses is reported and left out, and the rest go on. */
function read<T>(entries: Entry[], skip: Skip, reader: (e: Entry) => T): T[] {
  const out: T[] = [];
  for (const e of entries) {
    try {
      out.push(reader(e));
    } catch (err) {
      if (!(err instanceof RecordError)) throw err;
      skip(err.message);
    }
  }
  return out;
}

/** A post is read only when ticked «Publiser»; unticked, or without the box at all, it is a draft. */
const published = (e: Entry) => e.raw.publish === true;

/* Field readers: each says what it wants and names the field when it is not there. */
const str = (file: string, raw: Raw, key: string): string => {
  const v = raw[key];
  if (typeof v !== 'string' || v.trim() === '') throw new RecordError(file, `«${key}» must be a non-empty string`);
  return v;
};
const optStr = (file: string, raw: Raw, key: string): string | null => {
  const v = raw[key];
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string') throw new RecordError(file, `«${key}» must be a string or empty`);
  return v;
};
const isoDate = (file: string, raw: Raw, key: string): string => {
  const v = str(file, raw, key);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) throw new RecordError(file, `«${key}» must be an ISO date, YYYY-MM-DD`);
  return v;
};
const optIsoDate = (file: string, raw: Raw, key: string): string | null => (optStr(file, raw, key) === null ? null : isoDate(file, raw, key));
const optTime = (file: string, raw: Raw, key: string): string | null => {
  const v = optStr(file, raw, key);
  if (v !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) throw new RecordError(file, `«${key}» must be a time, HH:MM`);
  return v;
};
const int = (file: string, raw: Raw, key: string): number => {
  const v = raw[key];
  if (typeof v !== 'number' || !Number.isInteger(v)) throw new RecordError(file, `«${key}» must be a whole number`);
  return v;
};
const oneOf = <T extends string>(file: string, raw: Raw, key: string, kinds: readonly T[]): T => {
  const v = str(file, raw, key);
  if (!(kinds as readonly string[]).includes(v)) throw new RecordError(file, `«${key}» must be one of ${kinds.join(', ')}`);
  return v as T;
};
const optOneOf = <T extends string>(file: string, raw: Raw, key: string, kinds: readonly T[]): T | null =>
  optStr(file, raw, key) === null ? null : oneOf(file, raw, key, kinds);
/**
 * A file the CMS uploaded is stored by name; the public path is where it is served from.
 * A value that already starts with `/` is taken as the public path itself.
 */
const publicPath = (name: CollectionName, key: string, v: string): string => {
  if (v.startsWith('/') || /^https?:\/\//.test(v)) return v;
  const dir = (COLLECTIONS[name].files as Record<string, { directory: string; publicPath: string } | undefined>)[key];
  if (!dir) throw new Error(`${name}.${key} has no public path`);
  return dir.publicPath + v;
};
/**
 * A picture, in either shape it comes in: Keystatic's ticked box — `{ discriminant: true,
 * value: { src, alt } }`, or `{ discriminant: false }` for none — or `{ src, alt }` as written
 * by hand and as Menneskene's photos are.
 */
const picture = (name: CollectionName, file: string, raw: Raw, key: string): Picture | null => {
  const v = raw[key];
  if (v === undefined || v === null) return null;
  if (typeof v !== 'object' || Array.isArray(v)) throw new RecordError(file, `«${key}» must be { src, alt }`);
  let o = v as Raw;
  if ('discriminant' in o) {
    if (o.discriminant !== true) return null;
    if (!o.value || typeof o.value !== 'object' || Array.isArray(o.value)) return null;
    o = o.value as Raw;
  }
  const src = optStr(file, o, 'src');
  if (src === null) return null;
  const alt = optStr(file, o, 'alt');
  if (alt === null) throw new RecordError(file, `«${key}» has a picture and no alt text`);
  return { src: publicPath(name, key, src), alt };
};

/** The fields every post shares. */
const postFields = (name: CollectionName, { file, slug, raw, body }: Entry): PostFields => ({
  slug,
  title: str(file, raw, 'title'),
  summary: str(file, raw, 'summary'),
  image: picture(name, file, raw, 'image'),
  area: optOneOf(file, raw, 'area', AREA_KEYS),
  body,
});

/* ----- the collections ----- */

export function getEvents(dir = collectionDir('arrangementer'), skip: Skip = warn): Event[] {
  const entries = readCollection('arrangementer', dir, skip).filter(published);
  return read(entries, skip, (e) => ({
    ...postFields('arrangementer', e),
    start: isoDate(e.file, e.raw, 'start'),
    time: optTime(e.file, e.raw, 'time'),
    end: optIsoDate(e.file, e.raw, 'end'),
    place: str(e.file, e.raw, 'place'),
    link: optStr(e.file, e.raw, 'link'),
  })).sort((a, b) => a.start.localeCompare(b.start) || (a.time ?? '').localeCompare(b.time ?? ''));
}

/**
 * Kommende and tidligere, by today's date. An event is upcoming until the end of its last
 * day, so a whole-day event still stands under «Kommende» on the day itself.
 */
export function splitEvents(events: Event[], today: string): { upcoming: Event[]; past: Event[] } {
  const upcoming = events.filter((e) => (e.end ?? e.start) >= today);
  const past = events.filter((e) => (e.end ?? e.start) < today).reverse();
  return { upcoming, past };
}

export function getNews(dir = collectionDir('nyheter'), skip: Skip = warn): NewsItem[] {
  const entries = readCollection('nyheter', dir, skip).filter(published);
  return read(entries, skip, (e) => ({
    ...postFields('nyheter', e),
    date: isoDate(e.file, e.raw, 'date'),
  })).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'nb'));
}

export function getResources(dir = collectionDir('ressurser'), skip: Skip = warn): Resource[] {
  const entries = readCollection('ressurser', dir, skip).filter(published);
  return read(entries, skip, (e) => {
    const f = optStr(e.file, e.raw, 'file');
    const url = optStr(e.file, e.raw, 'url');
    if (!f && !url && !e.body) throw new RecordError(e.file, 'needs a «file», a «url» or a full text');
    return {
      ...postFields('ressurser', e),
      kind: oneOf(e.file, e.raw, 'kind', RESOURCE_KINDS),
      date: isoDate(e.file, e.raw, 'date'),
      file: f === null ? null : publicPath('ressurser', 'file', f),
      url,
    };
  }).sort((a, b) => b.date.localeCompare(a.date));
}

export function getDocuments(dir = collectionDir('styringsdokumenter'), skip: Skip = warn): GoverningDocument[] {
  return read(readCollection('styringsdokumenter', dir, skip), skip, ({ file, slug, raw }) => ({
    slug,
    title: str(file, raw, 'title'),
    kind: oneOf(file, raw, 'kind', DOCUMENT_KINDS),
    year: int(file, raw, 'year'),
    file: publicPath('styringsdokumenter', 'file', str(file, raw, 'file')),
  })).sort((a, b) => b.year - a.year || a.title.localeCompare(b.title, 'nb'));
}

export function getPeople(dir = collectionDir('menneskene'), skip: Skip = warn): Person[] {
  return read(readCollection('menneskene', dir, skip), skip, ({ file, slug, raw }) => ({
    slug,
    name: str(file, raw, 'name'),
    role: str(file, raw, 'role'),
    photo: picture('menneskene', file, raw, 'photo'),
    bio: str(file, raw, 'bio'),
    order: int(file, raw, 'order'),
  })).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'nb'));
}

/** Today as an ISO date in Oslo's time zone, which is where the events are. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Oslo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
