// The poster at the widths a screen asks for, AVIF and WebP, cut from the film's poster already in
// public/media, so a phone takes a 14-21 KB file where it took the 142 KB JPEG (the LCP element on a
// phone, 2026-09-25: ~3.7 s in Lighthouse).
//
// node scripts/dev/elite-media.mjs
import { statSync } from 'node:fs';
import sharp from 'sharp';

const OUT = 'public/media';
const FILM = 'iqra-ilm';
const kb = (f) => `${Math.round(statSync(f).size / 1024)} KB`;

const POSTER_WIDTHS = [480, 720, 960, 1280, 1600, 1920];
for (const w of POSTER_WIDTHS) {
  const base = `${OUT}/${FILM}-poster-${w}`;
  await sharp(`${OUT}/${FILM}-poster.jpg`).resize(w).avif({ quality: 52, effort: 6 }).toFile(`${base}.avif`);
  await sharp(`${OUT}/${FILM}-poster.jpg`).resize(w).webp({ quality: 72, effort: 6 }).toFile(`${base}.webp`);
  console.log(`poster ${w}: ${kb(`${base}.avif`)} avif, ${kb(`${base}.webp`)} webp`);
}
