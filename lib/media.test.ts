import { expect, test } from 'vitest';
import { existsSync } from 'node:fs';
import { FILM, pickSource, POSTER } from './media';

test.each([
  [false, true, '/media/iqra-ilm-1080.webm'],
  [false, false, '/media/iqra-ilm-1080.mp4'],
  [true, true, '/media/iqra-ilm-720.webm'],
  [true, false, '/media/iqra-ilm-720.mp4'],
])('narrow=%s webm=%s -> %s', (narrow, webm, expected) => {
  expect(pickSource({ narrow, webm })).toBe(expected);
});

test('every file the site asks for is in public/media under the film’s name', () => {
  expect(POSTER).toBe(`/media/${FILM}-poster.jpg`);
  const asked = [POSTER, ...[true, false].flatMap((narrow) => [true, false].map((webm) => pickSource({ narrow, webm })))];
  for (const f of asked) expect(existsSync(`public${f}`), f).toBe(true);
});
