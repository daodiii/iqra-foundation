import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { getEvents, getNews, getPeople, getResources, splitEvents, todayISO } from './content';

/*
 * The readers against a fixture directory: what a well-formed record becomes, what a
 * malformed one is refused for, and how the lists are ordered. The real collections ship
 * empty, so this is where the shapes are exercised.
 */
let dir: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'iqra-content-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const write = (name: string, record: unknown) => {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, name), JSON.stringify(record), 'utf8');
};

describe('an empty collection', () => {
  test('a directory that does not exist is an empty list, not an error', () => {
    expect(getEvents(path.join(dir, 'nowhere'))).toEqual([]);
  });
  test('a directory with only a README is empty too', () => {
    writeFileSync(path.join(dir, 'README.md'), '# x', 'utf8');
    expect(getResources(dir)).toEqual([]);
  });
});

describe('arrangementer', () => {
  test('a record becomes an event, the slug from the file name, optional fields null', () => {
    write('apen-kveld.json', { title: 'Åpen kveld', start: '2027-01-20', place: 'Oslo', text: 'Tekst.' });
    expect(getEvents(dir)).toEqual([
      { slug: 'apen-kveld', title: 'Åpen kveld', start: '2027-01-20', time: null, end: null, place: 'Oslo', text: 'Tekst.', link: null, program: null, report: null, recording: null, image: null, area: null },
    ]);
  });
  test('an area is carried when it is one of the four, null when absent or empty, refused otherwise', () => {
    write('a.json', { title: 'A', start: '2027-01-20', place: 'Oslo', text: 'T', area: 'dialog' });
    expect(getEvents(dir)[0].area).toBe('dialog');
    write('a.json', { title: 'A', start: '2027-01-20', place: 'Oslo', text: 'T', area: '' });
    expect(getEvents(dir)[0].area).toBeNull();
    write('a.json', { title: 'A', start: '2027-01-20', place: 'Oslo', text: 'T' });
    expect(getEvents(dir)[0].area).toBeNull();
    write('a.json', { title: 'A', start: '2027-01-20', place: 'Oslo', text: 'T', area: 'sport' });
    expect(() => getEvents(dir)).toThrow(/«area» must be one of kunnskap, dialog, moteplasser, samfunnsdeltakelse/);
  });
  test('a picture carries its alt, and a file name gets the public path', () => {
    write('a.json', { title: 'A', start: '2027-01-20', place: 'Oslo', text: 'T', image: { src: 'bilde.jpg', alt: 'Et bilde' } });
    expect(getEvents(dir)[0].image).toEqual({ src: '/media/arrangementer/bilde.jpg', alt: 'Et bilde' });
  });
  test('a picture without alt text is refused, naming the file and the field', () => {
    write('a.json', { title: 'A', start: '2027-01-20', place: 'Oslo', text: 'T', image: { src: 'bilde.jpg', alt: '' } });
    expect(() => getEvents(dir)).toThrow(/a\.json: «image» has a picture and no alt text/);
  });
  test('an empty picture object is no picture', () => {
    write('a.json', { title: 'A', start: '2027-01-20', place: 'Oslo', text: 'T', image: { src: '', alt: '' } });
    expect(getEvents(dir)[0].image).toBeNull();
  });
  test('a bad date, a bad time and a missing place are each refused with the field named', () => {
    write('a.json', { title: 'A', start: '20.01.2027', place: 'Oslo', text: 'T' });
    expect(() => getEvents(dir)).toThrow(/«start» must be an ISO date/);
    write('a.json', { title: 'A', start: '2027-01-20', time: '18', place: 'Oslo', text: 'T' });
    expect(() => getEvents(dir)).toThrow(/«time» must be a time, HH:MM/);
    write('a.json', { title: 'A', start: '2027-01-20', text: 'T' });
    expect(() => getEvents(dir)).toThrow(/«place» must be a non-empty string/);
  });
  test('invalid JSON is refused with the file named', () => {
    writeFileSync(path.join(dir, 'x.json'), '{ not json', 'utf8');
    expect(() => getEvents(dir)).toThrow(/x\.json: is not valid JSON/);
  });
  test('events are in date order, then by time', () => {
    write('b.json', { title: 'B', start: '2027-03-01', time: '19:00', place: 'O', text: 'T' });
    write('a.json', { title: 'A', start: '2027-03-01', time: '10:00', place: 'O', text: 'T' });
    write('c.json', { title: 'C', start: '2027-01-01', place: 'O', text: 'T' });
    expect(getEvents(dir).map((e) => e.title)).toEqual(['C', 'A', 'B']);
  });
});

describe('splitEvents', () => {
  const ev = (title: string, start: string, end: string | null = null) =>
    ({ slug: title, title, start, time: null, end, place: 'O', text: 'T', link: null, program: null, report: null, recording: null, image: null, area: null });
  test('kommende from today on, tidligere before it, the past newest first', () => {
    // In date order, as getEvents hands them over.
    const { upcoming, past } = splitEvents([ev('older', '2026-08-01'), ev('gone', '2026-09-01'), ev('today', '2026-09-15'), ev('soon', '2026-10-01')], '2026-09-15');
    expect(upcoming.map((e) => e.title)).toEqual(['today', 'soon']);
    expect(past.map((e) => e.title)).toEqual(['gone', 'older']);
  });
  test('an event over several days is upcoming until its last day is over', () => {
    const { upcoming } = splitEvents([ev('week', '2026-09-10', '2026-09-16')], '2026-09-15');
    expect(upcoming.map((e) => e.title)).toEqual(['week']);
  });
});

describe('nyheter', () => {
  const post = (slug: string, record: unknown, body?: string) => {
    mkdirSync(path.join(dir, slug), { recursive: true });
    writeFileSync(path.join(dir, slug, 'index.json'), JSON.stringify(record), 'utf8');
    if (body !== undefined) writeFileSync(path.join(dir, slug, 'body.mdoc'), body, 'utf8');
  };
  test('a news item is a folder: headline, date, ingress, picture and article text; only ticked «Publiser» is read; newest first', () => {
    post('a', { title: 'Første', date: '2026-10-01', summary: 'Ingress A', publish: true, image: { discriminant: true, value: { src: 'a.jpg', alt: 'Et bilde' } } }, 'Artikkelen.\n');
    post('b', { title: 'Andre', date: '2026-11-01', summary: 'Ingress B', publish: true, image: { discriminant: false } });
    post('c', { title: 'Utkast', date: '2026-11-10', summary: 'S', publish: false }, 'Ikke publisert.');
    expect(getNews(dir)).toEqual([
      { slug: 'b', title: 'Andre', date: '2026-11-01', summary: 'Ingress B', image: null, body: null },
      { slug: 'a', title: 'Første', date: '2026-10-01', summary: 'Ingress A', image: { src: '/opplastet/nyheter/a.jpg', alt: 'Et bilde' }, body: 'Artikkelen.\n' },
    ]);
  });
  test('a published item without a headline, a date or an ingress is refused, with its file', () => {
    post('x', { title: 'X', date: '2026-10-01', publish: true });
    expect(() => getNews(dir)).toThrow(/content\/nyheter\/x\/index.json: «summary»/);
  });
});

describe('ressurser', () => {
  test('a resource needs a file, a video or a link, and an uploaded one gets its public path', () => {
    write('r.json', { title: 'Rapport', category: 'publikasjoner', date: '2026-05-01', summary: 'S', file: 'rapport.pdf' });
    expect(getResources(dir)[0]).toMatchObject({ category: 'publikasjoner', file: '/files/ressurser/rapport.pdf', video: null, url: null });
    write('r.json', { title: 'Foredrag', category: 'videoer', date: '2026-05-01', summary: 'S', video: 'foredrag.mp4' });
    expect(getResources(dir)[0]).toMatchObject({ category: 'videoer', file: null, video: '/files/ressurser/foredrag.mp4', url: null });
    write('r.json', { title: 'Rapport', category: 'publikasjoner', date: '2026-05-01', summary: 'S' });
    expect(() => getResources(dir)).toThrow(/needs a «file», a «video» or a «url»/);
  });
  test('the category is one of the client’s four, and nothing else', () => {
    for (const category of ['publikasjoner', 'artikler', 'videoer', 'styringsdokumenter']) {
      write('r.json', { title: 'X', category, date: '2026-05-01', summary: 'S', url: 'https://example.no' });
      expect(getResources(dir)[0].category).toBe(category);
    }
    write('r.json', { title: 'X', category: 'podkast', date: '2026-05-01', summary: 'S', url: 'https://example.no' });
    expect(() => getResources(dir)).toThrow(/«category» must be one of publikasjoner, artikler, videoer, styringsdokumenter/);
  });
  test('newest first', () => {
    write('a.json', { title: 'A', category: 'artikler', date: '2026-01-01', summary: 'S', url: 'https://a.no' });
    write('b.json', { title: 'B', category: 'artikler', date: '2026-06-01', summary: 'S', url: 'https://b.no' });
    expect(getResources(dir).map((r) => r.title)).toEqual(['B', 'A']);
  });
});

describe('menneskene', () => {
  test('people are ordered by `order`, then by name', () => {
    write('b.json', { name: 'B', role: 'Styremedlem', bio: 'x', order: 20 });
    write('a.json', { name: 'A', role: 'Styreleder', bio: 'x', order: 10 });
    write('c.json', { name: 'C', role: 'Styremedlem', bio: 'x', order: 20 });
    expect(getPeople(dir).map((p) => p.name)).toEqual(['A', 'B', 'C']);
  });
  test('a photo is a picture with its alt and public path', () => {
    write('a.json', { name: 'A', role: 'R', bio: 'x', order: 1, photo: { src: 'a.jpg', alt: 'A smiler' } });
    expect(getPeople(dir)[0].photo).toEqual({ src: '/media/menneskene/a.jpg', alt: 'A smiler' });
  });
});

test('today is an ISO date in Oslo time', () => {
  expect(todayISO(new Date('2026-09-15T23:30:00Z'))).toBe('2026-09-16');
  expect(todayISO(new Date('2026-01-15T23:30:00Z'))).toBe('2026-01-16');
  expect(todayISO(new Date('2026-09-15T12:00:00Z'))).toBe('2026-09-15');
});
