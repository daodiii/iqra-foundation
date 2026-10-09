// The board's stand-in bust («Bilde kommer»), baked once to an image: the same lit figure the print drew as
// SVG under a Gaussian blur, which the browser rasterised on the CPU for every print the first time the board
// was drawn (one of the first-visit hitches). node scripts/dev/elite-bust.mjs
import sharp from 'sharp';
const navy = '#2c394b';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="800" height="1000">
<defs>
<radialGradient id="l" cx="0.46" cy="0.34" r="0.6"><stop offset="0" stop-color="${navy}" stop-opacity="0.22"/><stop offset="1" stop-color="${navy}" stop-opacity="0"/></radialGradient>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${navy}" stop-opacity="0.5"/><stop offset="1" stop-color="${navy}" stop-opacity="0.22"/></linearGradient>
<filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
</defs>
<rect width="400" height="500" fill="#f0f0f1"/>
<rect width="400" height="500" fill="url(#l)"/>
<g filter="url(#b)" fill="url(#s)">
<path d="M14 520 C 24 404, 108 342, 200 338 C 292 342, 376 404, 386 520 Z"/>
<rect x="166" y="262" width="68" height="84" rx="20"/>
<ellipse cx="200" cy="198" rx="66" ry="82"/>
</g></svg>`;
await sharp(Buffer.from(svg)).webp({ quality: 92 }).toFile('public/media/bust.webp');
await sharp(Buffer.from(svg)).avif({ quality: 72 }).toFile('public/media/bust.avif');
console.log('ok');
