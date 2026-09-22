// The Kontakt page's map: node scripts/dev/kart.mjs <lat> <lon>
// Fetches OpenStreetMap's tiles round the point and stitches two maps of the SAME ground with
// the point at the EXACT centre — public/kart-1024.webp (zoom 16, 1024×768) and
// public/kart-1536.webp (zoom 17 at 2048×1536, then three quarters: finer streets for a dense
// screen) — so the page's pin, at 50%/50%, sits on the address under `object-fit: cover`,
// and the `sizes` on the page lets a phone take the small one (the map is its largest
// contentful paint; the 2× file at 577 KB put it at 5 s over 4G). Greyscale, since the page
// shows the map through a luminosity blend over navy and its colour never reaches the
// screen: a third of the bytes. Run it once more when the real address arrives; the comment
// on `contact.address` in content/site.no.ts says which point the shipped files were made for.
// Tiles are cached under .scratch/tiles (gitignored); OSM asks for a real User-Agent and no
// bulk downloading — this is at most 88 tiles, a quarter second apart.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const [lat, lon] = process.argv.slice(2).map(Number);
if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
  console.error('usage: node scripts/dev/kart.mjs <lat> <lon>');
  process.exit(1);
}

const CACHE = '.scratch/tiles';
const TILE = 256;
mkdirSync(CACHE, { recursive: true });

/** The point's position in tile units at a zoom (Web Mercator, as OSM slices it). */
function project(z) {
  const n = 2 ** z;
  const r = (lat * Math.PI) / 180;
  return { x: ((lon + 180) / 360) * n, y: ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n };
}

async function tile(z, x, y) {
  const f = `${CACHE}/${z}-${x}-${y}.png`;
  if (!existsSync(f)) {
    const res = await fetch(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`, {
      headers: { 'User-Agent': 'iqra-foundation-site/1.0 (contact page map, stitched once at build time)' },
    });
    if (!res.ok) throw new Error(`${res.status} for ${z}/${x}/${y}`);
    writeFileSync(f, Buffer.from(await res.arrayBuffer()));
    await new Promise((r) => setTimeout(r, 250));
  }
  return f;
}

/** A W×H map at zoom z with the point at its centre: enough whole tiles to cover it, then the crop, then `scale` of it. */
async function stitch(z, W, H, scale, out) {
  const p = project(z);
  const left = p.x * TILE - W / 2;
  const top = p.y * TILE - H / 2;
  const x0 = Math.floor(left / TILE);
  const y0 = Math.floor(top / TILE);
  const cols = Math.ceil((left + W) / TILE) - x0;
  const rows = Math.ceil((top + H) / TILE) - y0;
  const parts = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      parts.push({ input: await tile(z, x0 + c, y0 + r), left: c * TILE, top: r * TILE });
    }
  }
  const grid = await sharp({ create: { width: cols * TILE, height: rows * TILE, channels: 3, background: '#fff' } })
    .composite(parts)
    .png()
    .toBuffer();
  await sharp(grid)
    .extract({ left: Math.round(left - x0 * TILE), top: Math.round(top - y0 * TILE), width: W, height: H })
    .resize(Math.round(W * scale), Math.round(H * scale))
    .grayscale()
    .webp({ quality: 80 })
    .toFile(out);
  console.log(`wrote ${out} (z${z}, ${cols}×${rows} tiles, ${Math.round(W * scale)}×${Math.round(H * scale)}, centre ${lat} ${lon})`);
}

await stitch(16, 1024, 768, 1, 'public/kart-1024.webp');
await stitch(17, 2048, 1536, 0.75, 'public/kart-1536.webp');
