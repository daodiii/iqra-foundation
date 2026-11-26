import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { COLLECTIONS } from '@/content/collections';
import { getEvents, getNews, getPeople, getResources } from '@/lib/content';
import { blank, entryPaths, fromFiles, isSlug, problems, slugify, slugOf, toFiles, type Section, type Stored } from './schema';

/**
 * The editor's files are the site's files: what the editor writes, the site's readers read as
 * the same entry, and what is already there comes back from the editor byte for byte.
 */

let root: string;
beforeEach(() => { root = mkdtempSync(path.join(tmpdir(), 'redaksjon-')); });
afterEach(() => rmSync(root, { recursive: true, force: true }));

/** Writes files keyed by repo path under the temp root; returns the section's folder there. */
function lay(section: Section, files: Record<string, string>): string {
  for (const [p, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, p)), { recursive: true });
    writeFileSync(path.join(root, p), text, 'utf8');
  }
  return path.join(root, COLLECTIONS[section].dir);
}
const stored = <S extends Section>(fields: Stored<S>['fields'], extra = {}): Stored<S> => ({ fields, extra });

describe('slugs', () => {
  test('a title becomes a web address with Norwegian letters spelt out', () => {
    expect(slugify('Fra kunnskap til handling')).toBe('fra-kunnskap-til-handling');
    expect(slugify('Ærlig talt: Møte på Østlandet, Åsane!')).toBe('aerlig-talt-mote-pa-ostlandet-asane');
    expect(slugify('  --  ')).toBe('');
  });
  test('nothing that could leave the folder is a slug', () => {
    for (const bad of ['../x', 'a/b', 'a\\b', '', 'A', 'a--b', '-a', 'a.json', 'x'.repeat(81)]) expect(isSlug(bad)).toBe(false);
    expect(isSlug('fra-kunnskap-2026')).toBe(true);
    expect(() => entryPaths('nyheter', '../etc')).toThrow();
  });
  test('a path names its entry only inside its own section', () => {
    expect(slugOf('nyheter', 'content/nyheter/abc/index.json')).toBe('abc');
    expect(slugOf('nyheter', 'content/nyheter/abc/body.mdoc')).toBeNull();
    expect(slugOf('menneskene', 'content/menneskene/ali.json')).toBe('ali');
    expect(slugOf('menneskene', 'content/menneskene/README.md')).toBeNull();
    expect(slugOf('ressurser', 'content/menneskene/ali.json')).toBeNull();
  });
});

describe('what the editor writes, the site reads', () => {
  test('nyheter: folder with index.json and body.mdoc; the picture as Keystatic ticks it', () => {
    const files = toFiles('nyheter', 'fra-kunnskap', stored<'nyheter'>({
      title: 'Fra kunnskap til handling', date: '2026-11-19', summary: 'Ingressen.', publish: true,
      image: { src: '/opplastet/nyheter/fra-kunnskap/a.webp', alt: 'Et maleri' }, body: '## Læring\n\nTekst med **fet**.',
    }));
    expect(Object.keys(files)).toEqual(['content/nyheter/fra-kunnskap/index.json', 'content/nyheter/fra-kunnskap/body.mdoc']);
    expect(getNews(lay('nyheter', files))).toEqual([{
      slug: 'fra-kunnskap', title: 'Fra kunnskap til handling', date: '2026-11-19', summary: 'Ingressen.',
      image: { src: '/opplastet/nyheter/fra-kunnskap/a.webp', alt: 'Et maleri' }, body: '## Læring\n\nTekst med **fet**.\n',
    }]);
  });
  test('nyheter: «Vis på nettsiden» off is saved and not read by the site', () => {
    const files = toFiles('nyheter', 'utkast', stored<'nyheter'>({ ...blank('nyheter', '2026-11-19'), title: 'Utkast', summary: 'S' }));
    expect(getNews(lay('nyheter', files))).toEqual([]);
    expect(JSON.parse(files['content/nyheter/utkast/index.json'])).toMatchObject({ publish: false, image: { discriminant: false } });
  });
  test('arrangementer: empty optional fields are left out, the rest read back', () => {
    const files = toFiles('arrangementer', 'mote', stored<'arrangementer'>({
      ...blank('arrangementer', '2026-11-28'), title: 'Møte', time: '18:00', place: 'Oslo', text: 'Velkommen.',
      image: { src: '/opplastet/arrangementer/mote/b.webp', alt: 'Salen' },
    }, { area: 'dialog' }));
    expect(JSON.parse(files['content/arrangementer/mote.json'])).toEqual({
      area: 'dialog', title: 'Møte', start: '2026-11-28', time: '18:00', place: 'Oslo', text: 'Velkommen.',
      image: { src: '/opplastet/arrangementer/mote/b.webp', alt: 'Salen' },
    });
    expect(getEvents(lay('arrangementer', files))[0]).toMatchObject({ slug: 'mote', title: 'Møte', time: '18:00', end: null, area: 'dialog', image: { alt: 'Salen' } });
  });
  test('ressurser: a link alone is enough', () => {
    const files = toFiles('ressurser', 'vedtekter', stored<'ressurser'>({ ...blank('ressurser', '2026-11-03'), title: 'Vedtekter', category: 'styringsdokumenter', summary: 'S', url: 'https://example.org/v.pdf' }));
    expect(getResources(lay('ressurser', files))[0]).toMatchObject({ title: 'Vedtekter', category: 'styringsdokumenter', file: null, url: 'https://example.org/v.pdf' });
  });
  test('menneskene: name, role, order; photo and bio when there are any', () => {
    const files = toFiles('menneskene', 'ny-person', stored<'menneskene'>({ name: 'Ny Person', role: 'styremedlem', photo: null, bio: '', order: 6 }));
    expect(files['content/menneskene/ny-person.json']).toBe('{\n  "name": "Ny Person",\n  "role": "styremedlem",\n  "order": 6\n}\n');
    expect(getPeople(lay('menneskene', files))[0]).toEqual({ slug: 'ny-person', name: 'Ny Person', role: 'styremedlem', photo: null, bio: null, order: 6 });
  });
});

describe('what is there comes back unchanged', () => {
  test('every person in content/menneskene round-trips byte for byte', () => {
    const dir = path.join(process.cwd(), COLLECTIONS.menneskene.dir);
    const names = readdirSync(dir).filter((n) => n.endsWith('.json'));
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) {
      const p = `${COLLECTIONS.menneskene.dir}/${n}`;
      const text = readFileSync(path.join(dir, n), 'utf8');
      const slug = n.slice(0, -5);
      expect(toFiles('menneskene', slug, fromFiles('menneskene', slug, { [p]: text }))[p]).toBe(text);
    }
  });
  test('a news item Keystatic wrote (bare file name, ticked picture) opens with its picture path', () => {
    const p = 'content/nyheter/a/index.json';
    const got = fromFiles('nyheter', 'a', { [p]: JSON.stringify({ title: 'T', date: '2026-10-01', summary: 'S', publish: true, image: { discriminant: true, value: { src: 'a.jpg', alt: 'Bilde' } } }), 'content/nyheter/a/body.mdoc': 'Tekst\n' });
    expect(got.fields).toEqual({ title: 'T', date: '2026-10-01', summary: 'S', publish: true, image: { src: '/opplastet/nyheter/a.jpg', alt: 'Bilde' }, body: 'Tekst\n' });
  });
});

describe('what stands between an entry and the site', () => {
  test('a blank news item lists headline and ingress; a picture without words is named', () => {
    expect(problems('nyheter', blank('nyheter', '2026-11-19')).map((p) => p.text)).toEqual(['Overskrift', 'Ingress']);
    const n = { ...blank('nyheter', '2026-11-19'), title: 'T', summary: 'S', image: { src: '/x.webp', alt: ' ' } };
    expect(problems('nyheter', n).map((p) => p.key)).toEqual(['image']);
  });
  test('an event ending before it starts, a bad time and a link that is not one are named', () => {
    const a = { ...blank('arrangementer', '2026-11-28'), title: 'T', place: 'P', text: 'X', time: '25:00', end: '2026-11-01', link: 'påmelding' };
    expect(problems('arrangementer', a).map((p) => p.key)).toEqual(['time', 'end', 'link']);
  });
  test('a resource needs a file, a video or a link, and one of the client\'s categories', () => {
    const r = { ...blank('ressurser', '2026-11-03'), title: 'T', summary: 'S', category: 'annet' };
    expect(problems('ressurser', r).map((p) => p.key)).toEqual(['category', 'file']);
  });
});
