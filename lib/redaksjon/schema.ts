import { COLLECTIONS } from '@/content/collections';
import { klient } from '@/content/klient.no';

/**
 * The editor's four sections: their fields, what each needs before it can be saved, and how an
 * entry becomes the files the site reads (`lib/content.ts`) and back.
 *
 * The files are the ones Keystatic writes, at the paths `content/collections.ts` declares, so a
 * post written in either opens in the other. Keys the editor does not know (an event's `area`,
 * say) are carried through untouched: saving never drops what someone else put there.
 */

export const SECTIONS = ['nyheter', 'arrangementer', 'ressurser', 'menneskene'] as const;
export type Section = (typeof SECTIONS)[number];
export const isSection = (v: unknown): v is Section => typeof v === 'string' && (SECTIONS as readonly string[]).includes(v);

export type Pic = { src: string; alt: string } | null;

export type Nyhet = { title: string; date: string; summary: string; image: Pic; publish: boolean; body: string };
export type Arrangement = {
  title: string; start: string; time: string; end: string; place: string; text: string;
  link: string; program: string; report: string; recording: string; image: Pic;
};
export type Ressurs = { title: string; category: string; date: string; summary: string; file: string; video: string; url: string };
export type Person = { name: string; role: string; photo: Pic; bio: string; order: number };

export type EntryOf = { nyheter: Nyhet; arrangementer: Arrangement; ressurser: Ressurs; menneskene: Person };
/** An entry as the editor holds it, plus the keys it does not edit, kept as they were. */
export type Stored<S extends Section> = { fields: EntryOf[S]; extra: Record<string, unknown> };

/** The section's names on screen. */
export const LABELS: Record<Section, { one: string; many: string; titleKey: string }> = {
  nyheter: { one: 'Nyhet', many: 'Nyheter', titleKey: 'title' },
  arrangementer: { one: 'Arrangement', many: 'Arrangementer', titleKey: 'title' },
  ressurser: { one: 'Ressurs', many: 'Bibliotek', titleKey: 'title' },
  menneskene: { one: 'Person', many: 'Menneskene bak', titleKey: 'name' },
};

export const CATEGORIES = klient.resources.categories.map((c) => ({ key: c.key as string, label: c.title as string }));

/* ----- slugs and paths ----- */

/** A web address from a title: lower case, Norwegian letters spelt out, words joined by «-». */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/** Only `a-z`, `0-9` and single dashes: nothing that could leave the section's folder. */
export const isSlug = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) && v.length <= 80;

/** The files one entry lives in, repo-relative. */
export function entryPaths(section: Section, slug: string): string[] {
  if (!isSlug(slug)) throw new Error(`Ugyldig nettadresse: ${slug}`);
  const dir = COLLECTIONS[section].dir;
  return section === 'nyheter' ? [`${dir}/${slug}/index.json`, `${dir}/${slug}/body.mdoc`] : [`${dir}/${slug}.json`];
}

/** The slug a repo path belongs to, or null when the path is not an entry of that section. */
export function slugOf(section: Section, path: string): string | null {
  const dir = COLLECTIONS[section].dir + '/';
  if (!path.startsWith(dir)) return null;
  const rest = path.slice(dir.length);
  const m = section === 'nyheter' ? /^([^/]+)\/index\.json$/.exec(rest) : /^([^/]+)\.json$/.exec(rest);
  return m && isSlug(m[1]) ? m[1] : null;
}

/* ----- reading files into the editor ----- */

type Raw = Record<string, unknown>;
const s = (v: unknown): string => (typeof v === 'string' ? v : '');

/** Where a picture field's uploads are served from, to turn a bare file name into a path. */
function publicBase(section: Section, key: string): string {
  const files = COLLECTIONS[section].files as Record<string, { publicPath: string } | undefined>;
  return files[key]?.publicPath ?? '/';
}

/** A picture in any shape the files hold: Keystatic's ticked box, a plain `{ src, alt }`, or none. */
function readPic(section: Section, key: string, v: unknown): Pic {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  let o = v as Raw;
  if ('discriminant' in o) {
    if (o.discriminant !== true || !o.value || typeof o.value !== 'object') return null;
    o = o.value as Raw;
  }
  const src = s(o.src);
  if (!src) return null;
  return { src: src.startsWith('/') || /^https?:\/\//.test(src) ? src : publicBase(section, key) + src, alt: s(o.alt) };
}

const KNOWN: Record<Section, string[]> = {
  nyheter: ['title', 'date', 'summary', 'image', 'publish'],
  arrangementer: ['title', 'start', 'time', 'end', 'place', 'text', 'link', 'program', 'report', 'recording', 'image'],
  ressurser: ['title', 'category', 'date', 'summary', 'file', 'video', 'url'],
  menneskene: ['name', 'role', 'photo', 'bio', 'order'],
};

/**
 * The editor's fields from any object: the JSON a file holds, or what the browser sent. Every
 * value is checked for its type, so nothing that is not a string reaches a string field.
 */
export function coerce<S extends Section>(section: S, raw: Raw, body = ''): EntryOf[S] {
  let fields: EntryOf[Section];
  switch (section) {
    case 'nyheter':
      fields = { title: s(raw.title), date: s(raw.date), summary: s(raw.summary), image: readPic(section, 'image', raw.image), publish: raw.publish === true, body };
      break;
    case 'arrangementer':
      fields = {
        title: s(raw.title), start: s(raw.start), time: s(raw.time), end: s(raw.end), place: s(raw.place), text: s(raw.text),
        link: s(raw.link), program: s(raw.program), report: s(raw.report), recording: s(raw.recording), image: readPic(section, 'image', raw.image),
      };
      break;
    case 'ressurser':
      fields = { title: s(raw.title), category: s(raw.category), date: s(raw.date), summary: s(raw.summary), file: s(raw.file), video: s(raw.video), url: s(raw.url) };
      break;
    default:
      fields = { name: s(raw.name), role: s(raw.role), photo: readPic(section, 'photo', raw.photo), bio: s(raw.bio), order: typeof raw.order === 'number' ? raw.order : 10 };
  }
  return fields as EntryOf[S];
}

/** An entry from its files' contents (`files` keyed by repo path; a missing body is empty). */
export function fromFiles<S extends Section>(section: S, slug: string, files: Record<string, string | null>): Stored<S> {
  const [jsonPath, bodyPath] = entryPaths(section, slug);
  const text = files[jsonPath];
  if (text == null) throw new Error(`${jsonPath} finnes ikke`);
  const raw = JSON.parse(text) as Raw;
  const extra: Raw = {};
  for (const [k, v] of Object.entries(raw)) if (!KNOWN[section].includes(k)) extra[k] = v;
  return { fields: coerce(section, raw, bodyPath ? (files[bodyPath] ?? '') : ''), extra };
}

/* ----- writing the editor's entry to files ----- */

/** Drops empty optional values, so a file holds only what was filled in. */
function compact(o: Raw): Raw {
  const out: Raw = {};
  for (const [k, v] of Object.entries(o)) if (v !== '' && v !== null && v !== undefined) out[k] = v;
  return out;
}
const json = (o: Raw) => JSON.stringify(o, null, 2) + '\n';

/** The files for an entry, keyed by repo path. The JSON keeps the keys the editor does not know. */
export function toFiles<S extends Section>(section: S, slug: string, entry: Stored<S>): Record<string, string> {
  const [jsonPath, bodyPath] = entryPaths(section, slug);
  const f = entry.fields as EntryOf[Section];
  switch (section) {
    case 'nyheter': {
      const n = f as Nyhet;
      // Keystatic's shape for a ticked picture, which the site's reader also takes.
      const image = n.image ? { discriminant: true, value: { src: n.image.src, alt: n.image.alt } } : { discriminant: false };
      return {
        [jsonPath]: json({ ...entry.extra, title: n.title, date: n.date, summary: n.summary, image, publish: n.publish }),
        [bodyPath]: n.body.trim() ? n.body.replace(/\s*$/, '\n') : '',
      };
    }
    case 'arrangementer': {
      const a = f as Arrangement;
      return { [jsonPath]: json({ ...entry.extra, ...compact({ ...a, image: a.image ? { src: a.image.src, alt: a.image.alt } : null }) }) };
    }
    case 'ressurser':
      return { [jsonPath]: json({ ...entry.extra, ...compact({ ...(f as Ressurs) }) }) };
    default: {
      const p = f as Person;
      return { [jsonPath]: json({ ...entry.extra, ...compact({ ...p, photo: p.photo ? { src: p.photo.src, alt: p.photo.alt } : null }) }) };
    }
  }
}

/* ----- what stands between an entry and the site ----- */

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const isDate = (v: string) => ISO.test(v) && !Number.isNaN(Date.parse(v));
const isUrl = (v: string) => /^https?:\/\/[^\s]+$/.test(v);

/**
 * What must still be filled in or fixed, as the editor shows it: field key and the words for
 * it. Empty means the entry can be saved. The server runs the same check before it writes.
 */
export function problems<S extends Section>(section: S, fields: EntryOf[S]): { key: string; text: string }[] {
  const out: { key: string; text: string }[] = [];
  const need = (key: string, ok: boolean, text: string) => { if (!ok) out.push({ key, text }); };
  const pic = (key: string, p: Pic) => { if (p) need(key, p.alt.trim() !== '', 'Bildebeskrivelse'); };
  const f = fields as EntryOf[Section];
  switch (section) {
    case 'nyheter': {
      const n = f as Nyhet;
      need('title', n.title.trim() !== '', 'Overskrift');
      need('date', isDate(n.date), 'Dato');
      need('summary', n.summary.trim() !== '', 'Ingress');
      pic('image', n.image);
      need('body', !/!\[\s*\]\(/.test(n.body), 'Beskrivelse på bilde i teksten');
      break;
    }
    case 'arrangementer': {
      const a = f as Arrangement;
      need('title', a.title.trim() !== '', 'Tittel');
      need('start', isDate(a.start), 'Dato');
      need('time', a.time === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(a.time), 'Klokkeslett som 18:00');
      need('end', a.end === '' || (isDate(a.end) && a.end >= a.start), 'Sluttdato etter startdato');
      need('place', a.place.trim() !== '', 'Sted');
      need('text', a.text.trim() !== '', 'Beskrivelse');
      need('link', a.link === '' || isUrl(a.link), 'Påmelding som en nettadresse');
      need('recording', a.recording === '' || isUrl(a.recording), 'Opptak som en nettadresse');
      pic('image', a.image);
      break;
    }
    case 'ressurser': {
      const r = f as Ressurs;
      need('title', r.title.trim() !== '', 'Tittel');
      need('category', CATEGORIES.some((c) => c.key === r.category), 'Kategori');
      need('date', isDate(r.date), 'Dato');
      need('summary', r.summary.trim() !== '', 'Sammendrag');
      need('url', r.url === '' || isUrl(r.url), 'Lenke som en nettadresse');
      need('file', r.file !== '' || r.video !== '' || r.url !== '', 'En fil, en video eller en lenke');
      break;
    }
    default: {
      const p = f as Person;
      need('name', p.name.trim() !== '', 'Navn');
      need('role', p.role.trim() !== '', 'Rolle');
      need('order', Number.isInteger(p.order), 'Rekkefølge som et helt tall');
      pic('photo', p.photo);
    }
  }
  return out;
}

/** An empty entry for «Ny …», dated today where the section has a date. */
export function blank<S extends Section>(section: S, today: string): EntryOf[S] {
  const by: EntryOf = {
    nyheter: { title: '', date: today, summary: '', image: null, publish: false, body: '' },
    arrangementer: { title: '', start: today, time: '', end: '', place: '', text: '', link: '', program: '', report: '', recording: '', image: null },
    ressurser: { title: '', category: CATEGORIES[0]?.key ?? '', date: today, summary: '', file: '', video: '', url: '' },
    menneskene: { name: '', role: '', photo: null, bio: '', order: 10 },
  };
  return by[section];
}

/** The entry's title as lists show it. */
export const titleOf = (section: Section, fields: EntryOf[Section]): string =>
  String((fields as Record<string, unknown>)[LABELS[section].titleKey] ?? '');
