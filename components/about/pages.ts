/**
 * The faces of the book, and how each one is painted onto a canvas for the renderer to
 * use as a texture. `faces()` is pure so the pairing can be tested: the book turns
 * leaves, and leaf i shows faces[2i] on its front and faces[2i+1] on its back, so an
 * odd count or a chapter in the wrong slot puts a page on the wrong side of a sheet.
 */
import { site } from '@/content/site.no';

// Same values as app/globals.css; canvas cannot read the custom properties.
const NAVY = '#2a394b';
const CRIMSON = '#ab5263';
const INK = '#4b586a';
const MUTED = '#8a94a3';
const HAIRLINE = '#e3e7ec';
/** Cream stock. The paper is coloured here rather than warmed by the light, so the
 *  ink keeps its contrast and the pages look the same from every angle. */
const STOCK = '#f7f2e7';

export type Figure = { value: string; label: string };
export type Member = { name: string; role: string };

export type Face =
  | { kind: 'cover'; mark: string; title: string; sub: string }
  | { kind: 'opener'; label: string; num: string; title: string; lede: string; folio: string }
  | { kind: 'body'; label: string; paras: readonly string[]; team?: readonly Member[]; figures?: readonly Figure[]; folio: string }
  | { kind: 'ask'; label: string; title: string; lede: string; folio: string }
  | { kind: 'contact'; label: string; para: string; cta: string; folio: string }
  | { kind: 'blank' };

/**
 * Cover, then an opener and a body for every chapter, then the question, the contact
 * page, and one blank to close the last leaf. The blank matters: a leaf has two sides,
 * so an odd number of faces would leave the final sheet with nothing on its back.
 */
export function faces(): Face[] {
  const a = site.about;
  const out: Face[] = [
    { kind: 'cover', mark: site.name, title: a.cover.title, sub: a.cover.sub },
  ];
  let folio = 2;
  for (const ch of a.chapters) {
    out.push({
      kind: 'opener', label: a.openerLabel, num: ch.num, title: ch.title,
      lede: ch.lede, folio: String(folio++),
    });
    out.push({
      kind: 'body', label: ch.title, paras: ch.paras,
      team: 'team' in ch ? ch.team : undefined,
      figures: 'figures' in ch ? ch.figures : undefined,
      folio: String(folio++),
    });
  }
  out.push({ kind: 'ask', label: 'Til slutt', title: a.ask.title, lede: a.ask.lede, folio: String(folio++) });
  out.push({
    kind: 'contact', label: a.contact.label, para: a.contact.para,
    cta: site.hero.cta, folio: a.contact.place,
  });
  if (out.length % 2 === 1) out.push({ kind: 'blank' });
  return out;
}

/** How many sheets the book has; the last one never turns. */
export const leafCount = (n: number) => Math.ceil(n / 2);

function wrap(c: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(' ');
  let line = '', at = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (c.measureText(test).width > maxW && line) { c.fillText(line, x, at); at += lh; line = w; }
    else line = test;
  }
  if (line) c.fillText(line, x, at);
  return at + lh;
}

/** Paints one face at `W`x`H`. The caller owns the canvas it hands back. */
export function drawFace(face: Face, W: number, H: number): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  if (!c) return cv;
  const M = Math.round(W * 0.109);
  c.fillStyle = STOCK;
  c.fillRect(0, 0, W, H);
  c.textBaseline = 'alphabetic';

  if (face.kind === 'blank') return cv;

  if (face.kind === 'cover') {
    c.fillStyle = '#111c27';
    c.fillRect(0, 0, W, H);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(98,191,189,0.20)');
    g.addColorStop(1, 'rgba(11,17,24,0.55)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.font = '500 20px Geist, sans-serif';
    c.fillText(face.mark.toUpperCase(), M, M + 22);
    c.font = '600 104px Geist, sans-serif';
    c.fillStyle = '#fff';
    c.fillText(face.title, M, H - 210);
    c.fillStyle = CRIMSON;
    c.fillText('.', M + c.measureText(face.title).width, H - 210);
    c.fillStyle = 'rgba(255,255,255,.72)';
    c.font = '400 30px Geist, sans-serif';
    wrap(c, face.sub, M, H - 150, W - M * 2, 42);
    return cv;
  }

  c.fillStyle = INK;
  c.font = '500 21px Geist, sans-serif';
  c.fillText(face.label, M, M + 20);

  if (face.kind === 'opener') {
    c.fillStyle = CRIMSON;
    c.font = '800 190px Geist, sans-serif';
    c.fillText(face.num, M - 8, H * 0.52);
    c.fillStyle = NAVY;
    c.font = '600 76px Geist, sans-serif';
    c.fillText(face.title, M, H * 0.52 + 92);
    c.fillStyle = INK;
    c.font = '400 30px Geist, sans-serif';
    wrap(c, face.lede, M, H * 0.52 + 160, W - M * 2 - 60, 42);
  } else if (face.kind === 'body') {
    c.fillStyle = NAVY;
    c.font = '400 32px Geist, sans-serif';
    let y = M + 130;
    for (const t of face.paras) y = wrap(c, t, M, y, W - M * 2, 46) + 22;
    if (face.team) {
      y += 8;
      for (const m of face.team) {
        c.fillStyle = NAVY;
        c.font = '500 30px Geist, sans-serif';
        c.fillText(m.name, M, y);
        c.fillStyle = MUTED;
        c.font = '500 19px Geist, sans-serif';
        c.fillText(m.role, W - M - c.measureText(m.role).width, y - 2);
        c.strokeStyle = HAIRLINE;
        c.lineWidth = 1;
        c.beginPath(); c.moveTo(M, y + 18); c.lineTo(W - M, y + 18); c.stroke();
        y += 62;
      }
    }
    if (face.figures) {
      y += 20;
      face.figures.forEach((f, i) => {
        const x = M + i * Math.round(W * 0.33);
        c.fillStyle = NAVY;
        c.font = '600 66px Geist, sans-serif';
        c.fillText(f.value, x, y + 50);
        c.fillStyle = MUTED;
        c.font = '500 19px Geist, sans-serif';
        c.fillText(f.label, x, y + 84);
      });
    }
  } else if (face.kind === 'ask') {
    c.fillStyle = NAVY;
    c.font = '600 66px Geist, sans-serif';
    // `wrap` returns the y after the last line it set, and the lede has to start from
    // there rather than from a fixed offset: «Har du et spørsmål?» takes two lines in
    // this column, and a hardcoded +110 put the second line straight through the lede.
    const after = wrap(c, face.title, M, H * 0.46, W - M * 2, 82);
    c.fillStyle = INK;
    c.font = '400 30px Geist, sans-serif';
    wrap(c, face.lede, M, after + 28, W - M * 2 - 40, 42);
  } else if (face.kind === 'contact') {
    c.fillStyle = NAVY;
    c.font = '400 32px Geist, sans-serif';
    const y = wrap(c, face.para, M, M + 130, W - M * 2, 46) + 30;
    c.fillStyle = CRIMSON;
    const bw = 330, bh = 78;
    c.beginPath();
    if (typeof c.roundRect === 'function') c.roundRect(M, y, bw, bh, 39);
    else c.rect(M, y, bw, bh);
    c.fill();
    c.fillStyle = '#fff';
    c.font = '500 28px Geist, sans-serif';
    c.fillText(face.cta, M + 44, y + 50);
  }

  c.fillStyle = MUTED;
  c.font = '500 18px Geist, sans-serif';
  c.fillText(face.folio, M, H - 60);
  return cv;
}
