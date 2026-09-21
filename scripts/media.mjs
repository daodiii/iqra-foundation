import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync, unlinkSync } from 'node:fs';
import sharp from 'sharp';

// The hero film: Seedance's five-cut montage of 2026-09-16 (the courtyard, the scholar, the
// circle under the arches, a halaqa today, the handshake), native 1280×720, 5.04 s, no end
// card — so the whole of it loops, and 1080p is a Lanczos upscale made here, not a second master.
const MASTER = 'C:/Users/daodi/generations/iqra-ilm_a-cinematic-historical-montage-in-five-d_1789567288.mp4';
// The film's name, and the files': the same as lib/media.ts's FILM, and a NEW name for a new
// film — the files are cached for a year, so a new film under an old name is not seen by a
// returning visitor. Retire the old files with `git rm` when the name changes.
const FILM = 'iqra-ilm';
const OUT = 'public/media';
mkdirSync(OUT, { recursive: true });
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
const kb = (f) => Math.round(statSync(f).size / 1024);

// 1. Loops: the montage whole, no audio.
function loop(scale, mp4, webm, crfMp4, crfWebm) {
  ff(['-i', MASTER, '-an', '-vf', scale, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crfMp4),
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${OUT}/${mp4}`]);
  ff(['-i', MASTER, '-an', '-vf', scale, '-c:v', 'libvpx-vp9', '-crf', String(crfWebm), '-b:v', '0',
    '-row-mt', '1', `${OUT}/${webm}`]);
}
loop('scale=1920:1080:flags=lanczos', `${FILM}-1080.mp4`, `${FILM}-1080.webm`, 23, 33);
loop('scale=1280:720', `${FILM}-720.mp4`, `${FILM}-720.webm`, 24, 35);

// 2. Poster: frame 0 of the film at 1080 — what the letters show until the film has decoded.
const png = `${OUT}/${FILM}-poster.png`;
ff(['-i', MASTER, '-frames:v', '1', '-vf', 'scale=1920:1080:flags=lanczos', png]);
await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toFile(`${OUT}/${FILM}-poster.jpg`);
unlinkSync(png);

for (const f of [`${FILM}-1080.mp4`, `${FILM}-1080.webm`, `${FILM}-720.mp4`, `${FILM}-720.webm`, `${FILM}-poster.jpg`]) {
  console.log(`${f.padEnd(22)} ${kb(`${OUT}/${f}`)} KB`);
}
