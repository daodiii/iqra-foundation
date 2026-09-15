import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { COLLECTIONS, type CollectionName } from '@/content/collections';

/**
 * The one door the pages read the collections through.
 *
 * Everything that changes over time — events, resources, governing documents, people — is
 * a typed collection: one JSON file per entry under `content/<collection>/`, in the shape
 * `content/collections.ts` declares and Keystatic (`keystatic.config.ts`) writes. Pages
 * never read files themselves; they call `getEvents()` and the rest, which read, check and
 * sort. A record that is not what the type says fails the build with its path and the
 * field, rather than reaching a visitor half-formed.
 *
 * Adding an item by hand is one file: copy the shape from the README, drop it in the
 * directory, and it is on the page at the next build. Through Keystatic it is the same
 * file, written by the admin.
 */

/** One picture with its words: one field, so a photograph cannot arrive without an alt. */
export type Picture = { src: string; alt: string };

export type Event = {
  slug: string;
  title: string;
  /** ISO date, `YYYY-MM-DD`; written out on the page. */
  start: string;
  /** `HH:MM`, when there is one. */
  time: string | null;
  /** ISO date; for an event over more than one day. */
  end: string | null;
  place: string;
  text: string;
  link: string | null;
  image: Picture | null;
};

export type ResourceKind = 'publikasjon' | 'artikkel' | 'rapport' | 'presentasjon' | 'video' | 'annet';
export type Resource = {
  slug: string;
  title: string;
  kind: ResourceKind;
  /** ISO date. */
  date: string;
  summary: string;
  /** A file under `public/`, as its public path; or a URL elsewhere. One of the two. */
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

function readCollection(name: CollectionName, dir = collectionDir(name)): { file: string; slug: string; raw: Raw }[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return []; // no directory yet is the same as an empty one
  }
  return names
    .filter((n) => n.endsWith('.json'))
    .sort()
    .map((n) => {
      const file = path.join(COLLECTIONS[name].dir, n);
      let raw: unknown;
      try {
        raw = JSON.parse(readFileSync(path.join(dir, n), 'utf8'));
      } catch (e) {
        throw new RecordError(file, `is not valid JSON (${(e as Error).message})`);
      }
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new RecordError(file, 'is not an object');
      return { file, slug: n.slice(0, -'.json'.length), raw: raw as Raw };
    });
}

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
const picture = (name: CollectionName, file: string, raw: Raw, key: string): Picture | null => {
  const v = raw[key];
  if (v === undefined || v === null) return null;
  if (typeof v !== 'object' || Array.isArray(v)) throw new RecordError(file, `«${key}» must be { src, alt }`);
  const o = v as Raw;
  const src = optStr(file, o, 'src');
  if (src === null) return null;
  const alt = optStr(file, o, 'alt');
  if (alt === null) throw new RecordError(file, `«${key}» has a picture and no alt text`);
  return { src: publicPath(name, key, src), alt };
};

/* ----- the collections ----- */

export function getEvents(dir?: string): Event[] {
  return readCollection('arrangementer', dir)
    .map(({ file, slug, raw }) => ({
      slug,
      title: str(file, raw, 'title'),
      start: isoDate(file, raw, 'start'),
      time: optTime(file, raw, 'time'),
      end: optIsoDate(file, raw, 'end'),
      place: str(file, raw, 'place'),
      text: str(file, raw, 'text'),
      link: optStr(file, raw, 'link'),
      image: picture('arrangementer', file, raw, 'image'),
    }))
    .sort((a, b) => a.start.localeCompare(b.start) || (a.time ?? '').localeCompare(b.time ?? ''));
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

export function getResources(dir?: string): Resource[] {
  return readCollection('ressurser', dir)
    .map(({ file, slug, raw }) => {
      const f = optStr(file, raw, 'file');
      const url = optStr(file, raw, 'url');
      if (!f && !url) throw new RecordError(file, 'needs either «file» or «url»');
      return {
        slug,
        title: str(file, raw, 'title'),
        kind: oneOf(file, raw, 'kind', RESOURCE_KINDS),
        date: isoDate(file, raw, 'date'),
        summary: str(file, raw, 'summary'),
        file: f === null ? null : publicPath('ressurser', 'file', f),
        url,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getDocuments(dir?: string): GoverningDocument[] {
  return readCollection('styringsdokumenter', dir)
    .map(({ file, slug, raw }) => ({
      slug,
      title: str(file, raw, 'title'),
      kind: oneOf(file, raw, 'kind', DOCUMENT_KINDS),
      year: int(file, raw, 'year'),
      file: publicPath('styringsdokumenter', 'file', str(file, raw, 'file')),
    }))
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title, 'nb'));
}

export function getPeople(dir?: string): Person[] {
  return readCollection('menneskene', dir)
    .map(({ file, slug, raw }) => ({
      slug,
      name: str(file, raw, 'name'),
      role: str(file, raw, 'role'),
      photo: picture('menneskene', file, raw, 'photo'),
      bio: str(file, raw, 'bio'),
      order: int(file, raw, 'order'),
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'nb'));
}

/** Today as an ISO date in Oslo's time zone, which is where the events are. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Oslo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
