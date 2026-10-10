import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { imageSize } from 'image-size';
import sharp from 'sharp';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { pictureSize } from './picture-size';

const white = { width: 30, height: 20, channels: 3 as const, background: '#ffffff' };

/*
 * `root` stands in for public/, inside a temporary folder. Real pictures sit where a path
 * would land if a guard were missing — beside public/ (`outside.png`) and under a folder named
 * like a host (`example.org/a.png`) — so each "nothing" below fails if its guard goes.
 */
let base: string;
let root: string;
beforeEach(async () => {
  base = mkdtempSync(path.join(tmpdir(), 'iqra-public-'));
  root = path.join(base, 'public');
  mkdirSync(path.join(root, 'opplastet', 'nyheter'), { recursive: true });
  mkdirSync(path.join(root, 'example.org'), { recursive: true });
  const png = await sharp({ create: white }).png().toBuffer();
  writeFileSync(path.join(root, 'opplastet', 'nyheter', 'et bilde.png'), png);
  writeFileSync(path.join(root, 'example.org', 'a.png'), png);
  writeFileSync(path.join(base, 'outside.png'), png);
});
afterEach(() => {
  rmSync(base, { recursive: true, force: true });
});

test('a picture’s own width and height, from its file under public/', () => {
  expect(pictureSize('/opplastet/nyheter/et%20bilde.png', root)).toEqual({ width: 30, height: 20 });
});

test('nothing for a file that is not there', () => {
  expect(pictureSize('/opplastet/nyheter/borte.png', root)).toBeNull();
});

test('nothing for an outside address', () => {
  expect(pictureSize('https://example.org/a.png', root)).toBeNull();
  expect(pictureSize('//example.org/a.png', root)).toBeNull();
});

test('nothing for a path out of public/, written plain or %-escaped', () => {
  expect(pictureSize('/../outside.png', root)).toBeNull();
  expect(pictureSize('/%2e%2e/outside.png', root)).toBeNull();
});

// EXIF orientations 5–8 are a quarter turn; Next's optimiser applies them (sharp's rotate()).
test.each([
  [1, { width: 30, height: 20 }],
  [4, { width: 30, height: 20 }],
  [5, { width: 20, height: 30 }],
  [6, { width: 20, height: 30 }],
  [7, { width: 20, height: 30 }],
  [8, { width: 20, height: 30 }],
])('a phone picture with EXIF orientation %i is measured the way Next turns it: %o', async (orientation, upright) => {
  const jpeg = await sharp({ create: white }).jpeg().withMetadata({ orientation }).toBuffer();
  expect(imageSize(jpeg)).toMatchObject({ width: 30, height: 20, orientation }); // the fixture really carries it
  writeFileSync(path.join(root, 'opplastet', 'nyheter', 'telefon.jpg'), jpeg);
  expect(pictureSize('/opplastet/nyheter/telefon.jpg', root)).toEqual(upright);
});
