// The elite study's two pictures, cut from the film already in public/media (nothing new is shot):
//
// 1. The poster at the widths a screen asks for, AVIF and WebP, so a phone takes a 25-40 KB file
//    where it took the 142 KB JPEG (the LCP element on a phone, 2026-09-25: ~3.7 s in Lighthouse).
// 2. The modern study circle (the film at 3.2 s, the halaqa today), baked into a navy duotone for the
//    ground of the closing plate — a STAND-IN until the foundation's own photograph exists.
//
// node scripts/dev/elite-media.mjs
import { execFileSync } from 'node:child_process';
import { statSync, unlinkSync } from 'node:fs';
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

// The study circle: one frame of the 1080 loop, the circle centred.
const png = `${OUT}/${FILM}-krets.png`;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '3.2', '-i', `${OUT}/${FILM}-1080.mp4`, '-frames:v', '1', png], { stdio: 'inherit' });

// Navy duotone: the frame's luminance mapped from the deep navy (#1b2635) to a lifted navy
// (#4a5b72), so white type over any part of it clears 6:1 before the plate's own gradient.
const DARK = [0x1b, 0x26, 0x35];
const LIGHT = [0x4a, 0x5b, 0x72];
const { data, info } = await sharp(png).greyscale().normalise().raw().toBuffer({ resolveWithObject: true });
const out = Buffer.alloc(info.width * info.height * 3);
for (let i = 0; i < info.width * info.height; i++) {
  const t = data[i] / 255;
  for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(DARK[c] + (LIGHT[c] - DARK[c]) * t);
}
for (const w of [960, 1600]) {
  const base = `${OUT}/${FILM}-krets-${w}`;
  const img = sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } }).resize(w);
  await img.clone().avif({ quality: 50, effort: 6 }).toFile(`${base}.avif`);
  await img.clone().webp({ quality: 70, effort: 6 }).toFile(`${base}.webp`);
  console.log(`krets ${w}: ${kb(`${base}.avif`)} avif, ${kb(`${base}.webp`)} webp`);
}
unlinkSync(png);
