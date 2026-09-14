import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { leafCount } from '@/components/about/pages';
import { drawFace, faces, indexAt, progressFor } from './pages';

const [story, menneskene] = site.about.chapters;
const team = menneskene.team;

/** The page on the right at an integer progress i is faces[2i]; the left is faces[2i-1]. */
const right = (list: ReturnType<typeof faces>, p: number) => list[2 * p];
const left = (list: ReturnType<typeof faces>, p: number) => list[2 * p - 1];

/**
 * The renderer turns sheets, and sheet i shows faces[2i] on its front and faces[2i+1]
 * on its back. An odd count would leave the last sheet with nothing on its reverse.
 */
test('the faces pair evenly onto sheets, on a spread and one page at a time', () => {
  for (const single of [false, true]) {
    const f = faces(single);
    expect(f.length % 2).toBe(0);
    expect(f[f.length - 1].kind).toBe('blank');
  }
});

/**
 * There is no cover: the book stands open from the start («you should never see the
 * cover», 2026-09-14), so the front of the first leaf is never turned to the eye and is
 * left blank, and the first spread is the logo on white facing the words.
 */
test('the first spread is the logo facing the words, and nothing stands before it', () => {
  const f = faces(false);
  expect(f[0].kind).toBe('blank');
  expect(left(f, 1)).toMatchObject({ kind: 'logo' });
  expect(right(f, 1)).toMatchObject({
    kind: 'story',
    words: { label: site.about.label, lede: story.lede, para: story.paras[0] },
  });
  expect((right(f, 1) as { words: object }).words).not.toHaveProperty('count');
});

/** Every member is a spread of their own: the portrait slot left, the words right. */
test('member k is the spread after the words, portrait left and words right', () => {
  const f = faces(false);
  team.forEach((m, k) => {
    const p = progressFor(k);
    expect(left(f, p)).toMatchObject({ kind: 'portrait', index: k });
    expect(right(f, p)).toMatchObject({ kind: 'member', member: m, index: k, portrait: false });
  });
});

/**
 * One page at a time — the phone — keeps every page on the right and the backs blank, so a
 * turn shows a cream reverse and lands on the next page, never on a page's own mirror.
 */
test('one page at a time: the same pages on the right, blank backs, the portrait on the page', () => {
  const f = faces(true);
  expect(f[0].kind).toBe('blank');
  expect(right(f, 1)).toMatchObject({ kind: 'logo' });
  team.forEach((m, k) => {
    expect(right(f, progressFor(k))).toMatchObject({ kind: 'member', member: m, index: k, portrait: true });
  });
  for (let i = 1; i < f.length; i += 2) expect(f[i].kind).toBe('blank');
});

/** The rings speak in progress; the card and the label speak in members. Both ways round. */
test('a member’s progress is the same on both layouts, and reads back', () => {
  for (const single of [false, true]) {
    const f = faces(single);
    expect(leafCount(f.length) - 1).toBe(team.length + 1);
    team.forEach((_, k) => expect(indexAt(progressFor(k))).toBe(k));
  }
  expect(indexAt(1)).toBe(-1);
  expect(indexAt(0)).toBe(-1);
  expect(indexAt(1.4)).toBe(-1);
  expect(indexAt(1.6)).toBe(0);
});

/** «Teamet · 1 / 6» on every member page, from the content file, not written twice. */
test('every member page is labelled with the team and its place in it', () => {
  for (const single of [false, true]) {
    const members = faces(single).filter((f) => f.kind === 'member');
    expect(members).toHaveLength(team.length);
    members.forEach((f, k) => {
      if (f.kind === 'member') expect(f.label).toBe(`${site.people.teamLabel} · ${k + 1} / ${team.length}`);
    });
  }
});

/** Folios run in reading order; a duplicate means two pages claim the same number. */
test('the folios are unique', () => {
  for (const single of [false, true]) {
    const folios = faces(single)
      .map((f) => ('folio' in f ? f.folio : null))
      .filter((v): v is string => v !== null);
    expect(new Set(folios).size).toBe(folios.length);
  }
});

/** jsdom has a stubbed 2D context: every face still comes back as a canvas of the size asked. */
test('every face paints to a canvas of the size asked for', () => {
  const assets = { family: 'Geist', logo: null };
  for (const single of [false, true]) {
    for (const face of faces(single)) {
      const cv = drawFace(face, 384, 520, assets);
      expect(cv.width).toBe(384);
      expect(cv.height).toBe(520);
    }
  }
});
