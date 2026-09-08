import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { faces, leafCount } from './pages';

/**
 * The renderer turns sheets, and sheet i shows faces[2i] on its front and faces[2i+1]
 * on its back. An odd count would leave the last sheet with nothing on its reverse,
 * and a chapter in the wrong slot would put an opener on the back of its own body.
 */
test('the faces pair evenly onto sheets', () => {
  const f = faces();
  expect(f.length % 2).toBe(0);
  expect(leafCount(f.length)).toBe(f.length / 2);
});

test('the cover is first and every chapter gets an opener then a body, in order', () => {
  const f = faces();
  expect(f[0].kind).toBe('cover');
  site.about.chapters.forEach((ch, i) => {
    const opener = f[1 + i * 2];
    const body = f[2 + i * 2];
    expect(opener).toMatchObject({ kind: 'opener', num: ch.num, title: ch.title });
    expect(body).toMatchObject({ kind: 'body', label: ch.title });
  });
});

test('the question and the contact page close the book', () => {
  const f = faces();
  const kinds = f.map((x) => x.kind);
  expect(kinds).toContain('ask');
  expect(kinds).toContain('contact');
  expect(kinds.indexOf('ask')).toBeLessThan(kinds.indexOf('contact'));
});

/** Om oss is where the team lives, so the roster has to reach the book. */
test('the team reaches the Menneskene body, with every member', () => {
  const chapter = site.about.chapters.find((c) => 'team' in c);
  expect(chapter, 'no chapter in the content file carries a team').toBeDefined();
  const body = faces().find((f) => f.kind === 'body' && f.team);
  expect(body).toBeDefined();
  if (body && body.kind === 'body') {
    expect(body.team).toHaveLength(chapter!.team!.length);
  }
});

test('the figures reach the Arbeidet body', () => {
  const body = faces().find((f) => f.kind === 'body' && f.figures);
  expect(body).toBeDefined();
  if (body && body.kind === 'body') expect(body.figures!.length).toBeGreaterThan(0);
});

/** Folios run in reading order; a duplicate means two pages claim the same number. */
test('the folios are unique', () => {
  const folios = faces()
    .map((f) => ('folio' in f ? f.folio : null))
    .filter((v): v is string => v !== null);
  expect(new Set(folios).size).toBe(folios.length);
});
