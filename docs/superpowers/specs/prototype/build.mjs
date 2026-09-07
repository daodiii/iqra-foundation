import { readFileSync, writeFileSync } from 'node:fs';

const dir = new URL('.', import.meta.url);
const read = (f) => readFileSync(new URL(f, dir));
const data = (f, mime) => `data:${mime};base64,${read(f).toString('base64')}`;

let html = read('index.tpl.html').toString();
const map = {
  CSS: read('styles.css').toString(),
  JS: read('app.js').toString(),
  VIDEO: data('hero-720.webm', 'video/webm'),
  POSTER: data('poster-1280.jpg', 'image/jpeg'),
  HIRA: data('still-hira.jpg', 'image/jpeg'),
  ARAFAT: data('still-arafat.jpg', 'image/jpeg'),
  KORAN: data('still-koran.jpg', 'image/jpeg'),
  HARAM: data('still-haram.jpg', 'image/jpeg'),
};
for (const [k, v] of Object.entries(map)) html = html.split(`{{${k}}}`).join(v);
const missing = html.match(/\{\{[A-Z]+\}\}/g);
if (missing) throw new Error('unreplaced placeholders: ' + missing.join(' '));
writeFileSync(new URL('iqra-motion-concepts.html', dir), html);
console.log('wrote iqra-motion-concepts.html', Math.round(html.length / 1024), 'KB');
