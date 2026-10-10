import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { getDocuments, getEvents, getNews, getPeople, getResources, splitEvents, todayISO } from './content';

/*
 * The readers against a fixture directory: what a well-formed record becomes, what a
 * malformed one is left out for (and how that is reported), what a draft is, and how the
 * lists are ordered. `lib/fixtures/keystatic` is what the admin itself wrote (Task 1 of the
 * Innlegg plan, 2026-10-10); the rest is written here.
 */
let dir: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'iqra-content-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** A post on disk: a folder with its record and, when given, its full text. */
const post = (slug: string, record: unknown, body?: string) => {
  mkdirSync(path.join(dir, slug), { recursive: true });
  writeFileSync(path.join(dir, slug, 'index.json'), JSON.stringify(record), 'utf8');
  if (body !== undefined) writeFileSync(path.join(dir, slug, 'body.mdoc'), body, 'utf8');
};
/** A flat record: menneskene and styringsdokumenter. */
const flat = (name: string, record: unknown) => {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, name), JSON.stringify(record), 'utf8');
};
/** What a reader reports, instead of the build log. */
const listen = () => {
  const problems: string[] = [];
  return { problems, skip: (p: string) => void problems.push(p) };
};

const event = (more: Record<string, unknown> = {}) => ({ title: 'A', start: '2027-01-20', place: 'Oslo', summary: 'S', publish: true, ...more });
const news = (more: Record<string, unknown> = {}) => ({ title: 'N', date: '2027-01-20', summary: 'S', publish: true, ...more });
const resource = (more: Record<string, unknown> = {}) => ({ title: 'R', kind: 'rapport', date: '2026-05-01', summary: 'S', file: 'r.pdf', publish: true, ...more });

const FIXTURES = path.join(process.cwd(), 'lib', 'fixtures', 'keystatic');

describe('an empty collection', () => {
  test('a directory that does not exist is an empty list, not an error', () => {
    expect(getEvents(path.join(dir, 'nowhere'))).toEqual([]);
  });
  test('a README, a stray file or a folder without a record is not an entry', () => {
    writeFileSync(path.join(dir, 'README.md'), '# x', 'utf8');
    mkdirSync(path.join(dir, 'tom'));
    const { problems, skip } = listen();
    expect(getNews(dir, skip)).toEqual([]);
    expect(problems).toEqual([]);
  });
  test('a post written flat, as <slug>.json, is left out and reported with where it belongs', () => {
    flat('apen-kveld.json', event({ title: 'Åpen kveld' }));
    const { problems, skip } = listen();
    expect(getEvents(dir, skip)).toEqual([]);
    expect(problems).toEqual(['content/arrangementer/apen-kveld.json: a post is a folder, apen-kveld/index.json']);
  });
});

describe('drafts', () => {
  test('only a post ticked «Publiser» is read; unticked or without the box it is a draft, left out without a word', () => {
    post('ute', news({ title: 'Ute' }));
    post('av', news({ title: 'Av', publish: false }));
    post('uten', news({ title: 'Uten', publish: undefined }));
    post('tekst', news({ title: 'Tekst', publish: 'true' }));
    const { problems, skip } = listen();
    expect(getNews(dir, skip).map((n) => n.title)).toEqual(['Ute']);
    expect(problems).toEqual([]);
  });
  test('a broken draft is not reported: it is not on the site either way', () => {
    post('halv', { title: 'Halv', publish: false });
    const { problems, skip } = listen();
    expect(getNews(dir, skip)).toEqual([]);
    expect(problems).toEqual([]);
  });
});

describe('a broken record', () => {
  test('is left out and reported with its file and field; the rest are read', () => {
    post('god', event({ title: 'God' }));
    post('uten-sted', event({ title: 'Uten sted', place: undefined }));
    const { problems, skip } = listen();
    expect(getEvents(dir, skip).map((e) => e.title)).toEqual(['God']);
    expect(problems).toEqual(['content/arrangementer/uten-sted/index.json: «place» must be a non-empty string']);
  });
  test('invalid JSON is left out and reported with the file', () => {
    mkdirSync(path.join(dir, 'x'));
    writeFileSync(path.join(dir, 'x', 'index.json'), '{ not json', 'utf8');
    const { problems, skip } = listen();
    expect(getEvents(dir, skip)).toEqual([]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/^content\/arrangementer\/x\/index\.json: is not valid JSON/);
  });
  test('without a listener the report goes to the build log as a warning', () => {
    post('uten-sted', event({ place: undefined }));
    const warned: unknown[] = [];
    const original = console.warn;
    console.warn = (...args: unknown[]) => void warned.push(args.join(' '));
    try {
      expect(getEvents(dir)).toEqual([]);
    } finally {
      console.warn = original;
    }
    expect(warned).toEqual(['[innhold] hoppet over content/arrangementer/uten-sted/index.json: «place» must be a non-empty string']);
  });
});

describe('arrangementer', () => {
  test('a record becomes an event, the slug from the folder, optional fields null, no full text null', () => {
    post('apen-kveld', event({ title: 'Åpen kveld', summary: 'Kort.' }));
    expect(getEvents(dir)).toEqual([
      { slug: 'apen-kveld', title: 'Åpen kveld', start: '2027-01-20', time: null, end: null, place: 'Oslo', summary: 'Kort.', link: null, image: null, area: null, body: null },
    ]);
  });
  test('the full text is read as it is written; one that is only blank is none', () => {
    post('a', event(), '## Program\n\nTekst.\n');
    post('b', event({ title: 'B', start: '2027-02-01' }), '  \n');
    const [a, b] = getEvents(dir);
    expect(a.body).toBe('## Program\n\nTekst.\n');
    expect(b.body).toBeNull();
  });
  test('an area is carried when it is one of the four, null when absent or empty, refused otherwise', () => {
    post('a', event({ area: 'dialog' }));
    expect(getEvents(dir)[0].area).toBe('dialog');
    post('a', event({ area: '' }));
    expect(getEvents(dir)[0].area).toBeNull();
    post('a', event({ area: 'sport' }));
    const { problems, skip } = listen();
    expect(getEvents(dir, skip)).toEqual([]);
    expect(problems[0]).toMatch(/«area» must be one of kunnskap, dialog, moteplasser, samfunnsdeltakelse/);
  });
  test('a picture as Keystatic writes it — ticked, with its file and words — or unticked, none', () => {
    post('a', event({ image: { discriminant: true, value: { src: '/opplastet/arrangementer/a/image/src.jpg', alt: 'Et bilde' } } }));
    expect(getEvents(dir)[0].image).toEqual({ src: '/opplastet/arrangementer/a/image/src.jpg', alt: 'Et bilde' });
    post('a', event({ image: { discriminant: false } }));
    expect(getEvents(dir)[0].image).toBeNull();
    post('a', event({ image: { discriminant: false, value: null } }));
    expect(getEvents(dir)[0].image).toBeNull();
  });
  test('a picture as written by hand — { src, alt } — and a bare file name gets the public path', () => {
    post('a', event({ image: { src: 'bilde.jpg', alt: 'Et bilde' } }));
    expect(getEvents(dir)[0].image).toEqual({ src: '/opplastet/arrangementer/bilde.jpg', alt: 'Et bilde' });
  });
  test('a picture without its words is left out, naming the file and the field', () => {
    post('a', event({ image: { discriminant: true, value: { src: '/opplastet/arrangementer/a.jpg', alt: '' } } }));
    const { problems, skip } = listen();
    expect(getEvents(dir, skip)).toEqual([]);
    expect(problems).toEqual(['content/arrangementer/a/index.json: «image» has a picture and no alt text']);
  });
  test('a bad date and a bad time are each reported with the field named', () => {
    post('a', event({ start: '20.01.2027' }));
    post('b', event({ time: '18' }));
    const { problems, skip } = listen();
    expect(getEvents(dir, skip)).toEqual([]);
    expect(problems[0]).toMatch(/a\/index\.json: «start» must be an ISO date/);
    expect(problems[1]).toMatch(/b\/index\.json: «time» must be a time, HH:MM/);
  });
  test('a time written the Norwegian way is read, and written out as HH:MM', () => {
    const times = { a: '9:30', b: '18:00', c: '9.30', d: '18.00', e: '0.05', f: '23:59' };
    for (const [slug, time] of Object.entries(times)) post(slug, event({ title: slug, time }));
    const { problems, skip } = listen();
    expect(getEvents(dir, skip).map((e) => [e.title, e.time])).toEqual([
      ['e', '00:05'], ['a', '09:30'], ['c', '09:30'], ['b', '18:00'], ['d', '18:00'], ['f', '23:59'],
    ]);
    expect(problems).toEqual([]);
  });
  test('a range, words around the time, or an hour past 23 is still a broken record', () => {
    post('a', event({ time: '18:00–21:00' }));
    post('b', event({ time: 'kl 18' }));
    post('c', event({ time: '24.00' }));
    post('d', event({ time: '18:60' }));
    const { problems, skip } = listen();
    expect(getEvents(dir, skip)).toEqual([]);
    expect(problems).toEqual(['a', 'b', 'c', 'd'].map((s) => `content/arrangementer/${s}/index.json: «time» must be a time, HH:MM`));
  });
  test('events are in date order, then by time', () => {
    post('b', event({ title: 'B', start: '2027-03-01', time: '19:00' }));
    post('a', event({ title: 'A', start: '2027-03-01', time: '10:00' }));
    post('c', event({ title: 'C', start: '2027-01-01' }));
    expect(getEvents(dir).map((e) => e.title)).toEqual(['C', 'A', 'B']);
  });
});

describe('splitEvents', () => {
  const e = (start: string, end: string | null = null) => ({ slug: start, title: start, start, time: null, end, place: 'O', summary: 'S', link: null, image: null, area: null, body: null });

  test('kommende from today on, tidligere before it, the past newest first', () => {
    const { upcoming, past } = splitEvents([e('2027-01-01'), e('2027-02-01'), e('2027-03-01')], '2027-02-01');
    expect(upcoming.map((x) => x.start)).toEqual(['2027-02-01', '2027-03-01']);
    expect(past.map((x) => x.start)).toEqual(['2027-01-01']);
  });
  test('an event over several days is upcoming until its last day is over', () => {
    const { upcoming } = splitEvents([e('2027-01-01', '2027-01-03')], '2027-01-03');
    expect(upcoming).toHaveLength(1);
  });
});

describe('nyheter', () => {
  test('a record becomes a news item; newest first, then by title', () => {
    post('b', news({ title: 'B', date: '2027-01-20' }));
    post('a', news({ title: 'A', date: '2027-01-20' }));
    post('c', news({ title: 'C', date: '2027-03-01', area: 'kunnskap' }), 'Hele teksten.');
    const items = getNews(dir);
    expect(items.map((n) => n.title)).toEqual(['C', 'A', 'B']);
    expect(items[0]).toEqual({ slug: 'c', title: 'C', date: '2027-03-01', summary: 'S', image: null, area: 'kunnskap', body: 'Hele teksten.' });
  });
  test('a bad date is reported', () => {
    post('a', news({ date: 'i går' }));
    const { problems, skip } = listen();
    expect(getNews(dir, skip)).toEqual([]);
    expect(problems[0]).toMatch(/«date» must be an ISO date/);
  });
});

describe('ressurser', () => {
  test('a resource has a file, a link or a full text; the file gets its public path', () => {
    post('fil', resource({ title: 'Fil' }));
    post('lenke', resource({ title: 'Lenke', file: undefined, url: 'https://example.org/r' }));
    post('artikkel', resource({ title: 'Artikkel', kind: 'artikkel', file: undefined }), '## Innledning\n');
    post('ingenting', resource({ title: 'Ingenting', file: undefined }));
    const { problems, skip } = listen();
    const items = getResources(dir, skip);
    expect(items.map((r) => r.title).sort()).toEqual(['Artikkel', 'Fil', 'Lenke']);
    expect(items.find((r) => r.title === 'Fil')!.file).toBe('/files/ressurser/r.pdf');
    expect(items.find((r) => r.title === 'Artikkel')!.body).toBe('## Innledning\n');
    expect(problems).toEqual(['content/ressurser/ingenting/index.json: needs a «file», a «url» or a full text']);
  });
  test('an unknown kind is reported', () => {
    post('a', resource({ kind: 'bok' }));
    const { problems, skip } = listen();
    expect(getResources(dir, skip)).toEqual([]);
    expect(problems[0]).toMatch(/«kind» must be one of/);
  });
  test('newest first', () => {
    post('a', resource({ title: 'A', date: '2025-01-01' }));
    post('b', resource({ title: 'B', date: '2026-01-01' }));
    expect(getResources(dir).map((r) => r.title)).toEqual(['B', 'A']);
  });
});

describe('styringsdokumenter', () => {
  test('a document has a year and a file; newest year first, then by title', () => {
    flat('b.json', { title: 'Vedtekter', kind: 'vedtekter', year: 2025, file: 'v.pdf' });
    flat('a.json', { title: 'Årsrapport', kind: 'arsrapport', year: 2026, file: 'a.pdf' });
    expect(getDocuments(dir).map((d) => [d.title, d.file])).toEqual([
      ['Årsrapport', '/files/styringsdokumenter/a.pdf'],
      ['Vedtekter', '/files/styringsdokumenter/v.pdf'],
    ]);
  });
  test('a year that is not a whole number is reported', () => {
    flat('a.json', { title: 'X', kind: 'annet', year: '2025', file: 'x.pdf' });
    const { problems, skip } = listen();
    expect(getDocuments(dir, skip)).toEqual([]);
    expect(problems[0]).toMatch(/content\/styringsdokumenter\/a\.json: «year» must be a whole number/);
  });
});

describe('menneskene', () => {
  test('people are ordered by `order`, then by name', () => {
    flat('b.json', { name: 'Bente', role: 'R', bio: 'B', order: 2 });
    flat('a.json', { name: 'Arne', role: 'R', bio: 'B', order: 2 });
    flat('c.json', { name: 'Cato', role: 'R', bio: 'B', order: 1 });
    expect(getPeople(dir).map((p) => p.name)).toEqual(['Cato', 'Arne', 'Bente']);
  });
  test('a photo is a picture with its alt and public path', () => {
    flat('a.json', { name: 'A', role: 'R', bio: 'B', order: 1, photo: { src: 'a.jpg', alt: 'Et portrett' } });
    expect(getPeople(dir)[0].photo).toEqual({ src: '/media/menneskene/a.jpg', alt: 'Et portrett' });
  });
});

describe('what the admin wrote (lib/fixtures/keystatic)', () => {
  test('an event with its picture, its full text and its sign-up link', () => {
    const { problems, skip } = listen();
    const events = getEvents(path.join(FIXTURES, 'arrangementer'), skip);
    expect(problems).toEqual([]);
    expect(events).toHaveLength(1);
    const [e] = events;
    expect(e).toMatchObject({
      slug: 'testkveld', title: 'Testkveld', start: '2027-01-20', time: '18:00', end: null, place: 'Oslo',
      summary: 'En kveld for å prøve redigeringen.', area: 'dialog', link: 'https://example.org/pamelding',
    });
    expect(e.image?.alt).toBe('Et tomt møterom');
    expect(e.image?.src).toMatch(/^\/opplastet\/arrangementer\//);
    expect(e.body).toContain('## Program');
  });
  test('news: the published item is read with a picture in its full text, the draft left out without a word', () => {
    const { problems, skip } = listen();
    const items = getNews(path.join(FIXTURES, 'nyheter'), skip);
    expect(problems).toEqual([]);
    expect(items.map((n) => n.slug)).toEqual(['testnyhet']);
    expect(items[0]).toMatchObject({ title: 'Testnyhet', date: '2027-01-21', summary: 'En nyhet for å prøve redigeringen.', image: null });
    expect(items[0].body).toContain('## Bakgrunn');
    expect(items[0].body).toMatch(/!\[[^\]]*\]\(\/opplastet\/nyheter\//);
  });
  test('an article: a resource with a full text and neither file nor link', () => {
    const { problems, skip } = listen();
    const items = getResources(path.join(FIXTURES, 'ressurser'), skip);
    expect(problems).toEqual([]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ slug: 'testartikkel', title: 'Testartikkel', kind: 'artikkel', date: '2027-01-23', file: null, url: null });
    expect(items[0].body).toContain('## Innledning');
  });
});

test('today is an ISO date in Oslo time', () => {
  expect(todayISO(new Date('2026-09-15T23:30:00Z'))).toBe('2026-09-16');
  expect(todayISO(new Date('2026-01-15T23:30:00Z'))).toBe('2026-01-16');
  expect(todayISO(new Date('2026-09-15T12:00:00Z'))).toBe('2026-09-15');
});
