import { expect, test } from 'vitest';
import { pickSource } from './media';

test.each([
  [false, true, '/media/iqra-loop-1080.webm'],
  [false, false, '/media/iqra-loop-1080.mp4'],
  [true, true, '/media/iqra-loop-720.webm'],
  [true, false, '/media/iqra-loop-720.mp4'],
])('narrow=%s webm=%s -> %s', (narrow, webm, expected) => {
  expect(pickSource({ narrow, webm })).toBe(expected);
});
