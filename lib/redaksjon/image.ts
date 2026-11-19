import { slugify } from './schema';

/**
 * Pictures before they leave the browser: shrunk to at most 2000 px wide and turned into WebP
 * under 1.5 MB, so a phone photo of 6000 px and 8 MB goes up as a few hundred kilobytes, well
 * inside the server's 4.5 MB limit.
 */

export const MAX_WIDTH = 2000;
export const MAX_BYTES = 1.5 * 1024 * 1024;

/** The size to draw at: the same proportions, no wider than `max`, never enlarged. */
export function fit(width: number, height: number, max = MAX_WIDTH): { width: number; height: number } {
  if (width <= max) return { width, height };
  return { width: max, height: Math.round((height * max) / width) };
}

/** A file name for the upload: the original's name made safe, a short random tail, `.webp`. */
export function pictureName(original: string, random = Math.random().toString(36).slice(2, 6)): string {
  const stem = slugify(original.replace(/\.[^.]+$/, '')).slice(0, 40) || 'bilde';
  return `${stem}-${random}.webp`;
}

export type Shrunk = { blob: Blob; width: number; height: number };

/** Draws the picture smaller and encodes WebP, lowering the quality until it is under the limit. */
export async function shrink(file: Blob): Promise<Shrunk> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const size = fit(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Kunne ikke lese bildet.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();
  for (const q of [0.86, 0.78, 0.7, 0.6, 0.5]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', q));
    if (!blob || blob.type !== 'image/webp') throw new Error('Nettleseren kan ikke lage WebP.');
    if (blob.size <= MAX_BYTES) return { blob, ...size };
  }
  throw new Error('Bildet ble for stort selv etter forminsking. Prøv et annet bilde.');
}

/** The blob as base64, the way the save carries it. */
export async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
