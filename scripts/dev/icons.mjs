// The site's icons, from the guide's own mark: node scripts/dev/icons.mjs
// app/icon.svg (rounded, for tabs), app/favicon.ico (16/32/48, for crawlers and old browsers) and
// app/apple-icon.png (180, square: iOS rounds it itself). The guide's plate: its mark, navy with the
// crimson accent, on turquoise. The mark is drawn from public/brand/iqra-mark.svg and never recoloured.
import fs from 'node:fs';
import sharp from 'sharp';

const mark = fs.readFileSync('public/brand/iqra-mark.svg', 'utf8');
const viewBox = mark.match(/viewBox="([^"]+)"/)[1];
const inner = mark.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const [, , w, h] = viewBox.split(/\s+/).map(Number);

/** The plate with the mark across `fill` of its width, centred. */
const plate = (radius, fill) => {
  const width = 64 * fill;
  const height = (width * h) / w;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64"><rect width="64" height="64" rx="${radius}" fill="#67c1bf"/><svg x="${(64 - width) / 2}" y="${(64 - height) / 2}" width="${width}" height="${height}" viewBox="${viewBox}">${inner}</svg></svg>`;
};

fs.writeFileSync('app/icon.svg', plate(12, 0.8));

const png = (svg, size) => sharp(Buffer.from(svg), { density: (72 * size) / 64 * 4 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
await sharp(Buffer.from(plate(0, 0.8)), { density: 600 }).resize(180, 180).png({ compressionLevel: 9 }).toFile('app/apple-icon.png');

// An .ico is a small directory of images; PNG images inside it are read by every current browser.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((s) => png(plate(10, 0.86), s)));
const head = Buffer.alloc(6);
head.writeUInt16LE(0, 0);
head.writeUInt16LE(1, 2);
head.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = images.map((img, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(sizes[i], 0);
  e.writeUInt8(sizes[i], 1);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(img.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += img.length;
  return e;
});
fs.writeFileSync('app/favicon.ico', Buffer.concat([head, ...entries, ...images]));
console.log('icon.svg, apple-icon.png, favicon.ico written');
