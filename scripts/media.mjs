import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import sharp from 'sharp';

const SRC = 'C:/Users/daodi/generations/hero-web-1080-upscaled';
const MASTER = `${SRC}/iqra-hero.mp4`;
const OUT = 'public/media';
mkdirSync(OUT, { recursive: true });
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
const kb = (f) => Math.round(statSync(f).size / 1024);

// 1. Loops: the montage only (0-4.3 s, before the logo fade), no audio.
function loop(scale, mp4, webm, crfMp4, crfWebm) {
  ff(['-i', MASTER, '-t', '4.3', '-an', '-vf', scale, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crfMp4),
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${OUT}/${mp4}`]);
  ff(['-i', MASTER, '-t', '4.3', '-an', '-vf', scale, '-c:v', 'libvpx-vp9', '-crf', String(crfWebm), '-b:v', '0',
    '-row-mt', '1', `${OUT}/${webm}`]);
}
loop('scale=1920:1080', 'iqra-loop-1080.mp4', 'iqra-loop-1080.webm', 23, 33);
loop('scale=1280:720', 'iqra-loop-720.mp4', 'iqra-loop-720.webm', 24, 35);

// 2. Poster: frame 0 of the film, already exported next to the master.
copyFileSync(`${SRC}/iqra-hero-poster.jpg`, `${OUT}/iqra-poster.jpg`);

// 3. The Quran still (the film cuts to it at 2.3 s and away at 3.3 s).
const png = `${OUT}/still-koran.png`;
ff(['-ss', '2.80', '-i', MASTER, '-frames:v', '1', png]);
await sharp(png).avif({ quality: 50 }).toFile(`${OUT}/still-koran.avif`);
await sharp(png).webp({ quality: 80 }).toFile(`${OUT}/still-koran.webp`);
unlinkSync(png);

for (const f of ['iqra-loop-1080.mp4', 'iqra-loop-1080.webm', 'iqra-loop-720.mp4', 'iqra-loop-720.webm',
  'iqra-poster.jpg', 'still-koran.avif', 'still-koran.webp']) {
  console.log(`${f.padEnd(22)} ${kb(`${OUT}/${f}`)} KB`);
}
