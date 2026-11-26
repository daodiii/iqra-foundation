import { describe, expect, test } from 'vitest';
import { fit, pictureName, toBase64 } from './image';

describe('pictures before upload', () => {
  test('a 6000 px photo is drawn at 2000 px, same proportions; a small one is left alone', () => {
    expect(fit(6000, 4000)).toEqual({ width: 2000, height: 1333 });
    expect(fit(1200, 800)).toEqual({ width: 1200, height: 800 });
  });
  test('the file name is safe and ends in .webp', () => {
    expect(pictureName('IMG_2024 Åpen dag.HEIC', 'ab12')).toBe('img-2024-apen-dag-ab12.webp');
    expect(pictureName('../../.png', 'x')).toBe('bilde-x.webp');
  });
  test('base64 of the bytes', async () => {
    expect(await toBase64(new Blob([new Uint8Array([82, 73, 70, 70])]))).toBe('UklGRg==');
  });
});
