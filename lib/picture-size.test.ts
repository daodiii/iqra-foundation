import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { pictureSize } from './picture-size';

let root: string;
beforeEach(async () => {
  root = mkdtempSync(path.join(tmpdir(), 'iqra-public-'));
  mkdirSync(path.join(root, 'opplastet', 'nyheter'), { recursive: true });
  const png = await sharp({ create: { width: 30, height: 20, channels: 3, background: '#ffffff' } }).png().toBuffer();
  writeFileSync(path.join(root, 'opplastet', 'nyheter', 'et bilde.png'), png);
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

test('a picture’s own width and height, from its file under public/', () => {
  expect(pictureSize('/opplastet/nyheter/et%20bilde.png', root)).toEqual({ width: 30, height: 20 });
});

test('nothing for a file that is not there, an outside address, or a path out of public/', () => {
  expect(pictureSize('/opplastet/nyheter/borte.png', root)).toBeNull();
  expect(pictureSize('https://example.org/a.png', root)).toBeNull();
  expect(pictureSize('//example.org/a.png', root)).toBeNull();
  expect(pictureSize('/../package.json', root)).toBeNull();
});
