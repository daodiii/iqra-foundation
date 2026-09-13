/**
 * The faces of the book on the landing page, and how each is painted for the renderer.
 * Set on the same cream stock, in the same face and to the same margins as the book on
 * `/om-oss` (`components/about/pages.ts`); only what is printed on the pages is this
 * section's — the photograph, the words the section used to set in a frame, and the team
 * one person to a spread, which is what the member card used to be.
 *
 * `faces()` is pure so the pairing can be tested: the renderer turns leaves, and leaf i
 * shows faces[2i] on its front and faces[2i+1] on its back, so at an integer progress i
 * the open spread is [faces[2i-1] | faces[2i]]. Progress 0 is the closed cover.
 */
import { HAIRLINE, INK, type Member, MUTED, NAVY, STOCK, wrap } from '@/components/about/pages';
import { site } from '@/content/site.no';

const [story, menneskene] = site.about.chapters;

export type Words = { label: string; lede: string; para: string; count: string };

export type PeopleFace =
  /** The film's end card: the logo on pure white. */
  | { kind: 'cover' }
  /** The photograph, full bleed. */
  | { kind: 'photo' }
  | { kind: 'story'; words: Words; folio: string }
  /** The portrait slot on its own page, facing the member's words. */
  | { kind: 'portrait'; index: number; folio: string }
  /** One member: the label «Teamet · k / n», the role, the name, the line — and on one page
   *  at a time, the portrait slot above them, since there is no facing page to hold it. */
  | { kind: 'member'; member: Member; index: number; label: string; portrait: boolean; folio: string }
  | { kind: 'blank' };

/** Member k (0-based) is the spread after the words: the words are at 1, so k is at k + 2. */
export const progressFor = (index: number) => index + 2;
/** The member a progress is showing, or -1 for the cover and the words. */
export const indexAt = (p: number) => Math.max(-1, Math.round(p) - 2);

/**
 * A spread: [cover] · [photo | the words] · [portrait k | member k] for every member, and
 * one blank to close the last leaf. One page at a time (the phone): every page on the
 * right of its leaf and a blank on every back, so each turn shows a cream reverse and
 * lands on the next page — [cover] · [blank | photo] · [blank | member k]. On both, the
 * words are at 1 and member k at k + 2, so the rings and the label need not know which.
 */
export function faces(single: boolean): PeopleFace[] {
  const words: Words = {
    label: site.about.label, lede: story.lede, para: story.paras[0], count: menneskene.paras[0],
  };
  const team = menneskene.team;
  const out: PeopleFace[] = [{ kind: 'cover' }];
  let folio = 2;
  if (single) {
    out.push({ kind: 'blank' }, { kind: 'photo' }, { kind: 'blank' });
    team.forEach((member, index) => {
      out.push(
        { kind: 'member', member, index, label: memberLabel(index, team.length), portrait: true, folio: String(folio++) },
        { kind: 'blank' },
      );
    });
  } else {
    out.push({ kind: 'photo' }, { kind: 'story', words, folio: String(folio++) });
    team.forEach((member, index) => {
      out.push(
        { kind: 'portrait', index, folio: String(folio++) },
        { kind: 'member', member, index, label: memberLabel(index, team.length), portrait: false, folio: String(folio++) },
      );
    });
  }
  if (out.length % 2 === 1) out.push({ kind: 'blank' });
  return out;
}

/** «Teamet · 1 / 6» — the same words the band under the book shows. */
export const memberLabel = (index: number, count: number) => `${site.people.teamLabel} · ${index + 1} / ${count}`;

/** What the painter needs that is not content: the face, and the two pictures. */
export type Assets = {
  /** The page's own family, read off the document — `next/font` names it, not us. */
  family: string;
  logo: HTMLImageElement | null;
  photo: HTMLImageElement | null;
  /** Where the photograph's subject is, as a fraction of its height from the top. */
  focus: number;
};

/** Cover-fit an image into a rectangle, the crop centred on its focal point. */
function coverFit(c: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, focus: number) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const s = Math.max(w / iw, h / ih);
  const sw = w / s, sh = h / s;
  const sx = (iw - sw) / 2;
  const sy = Math.max(0, Math.min(ih - sh, ih * focus - sh / 2));
  c.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** The portrait slot as the card drew it: a grey rectangle with a little weight at its foot. */
function portraitSlot(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  c.fillStyle = HAIRLINE;
  c.fillRect(x, y, w, h);
  const g = c.createLinearGradient(0, y + h, 0, y + h * 0.6);
  g.addColorStop(0, 'rgba(20,30,42,0.12)');
  g.addColorStop(1, 'rgba(20,30,42,0)');
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
}

/** A hair space between the letters: the role in tracked caps, as the card set it. */
const tracked = (text: string) => text.toUpperCase().split('').join(' ');

/**
 * Paints one face at `W`×`H`. The caller owns the canvas it hands back. Every measure is
 * set for a 768-wide page and scaled from there, so the phone's half-size textures carry
 * the same page, smaller.
 */
export function drawFace(face: PeopleFace, W: number, H: number, assets: Assets): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  if (!c) return cv;
  const px = (v: number) => Math.round((v * W) / 768);
  const font = (weight: number, size: number) => `${weight} ${px(size)}px ${assets.family}`;
  const M = Math.round(W * 0.109);
  c.fillStyle = STOCK;
  c.fillRect(0, 0, W, H);
  c.textBaseline = 'alphabetic';

  if (face.kind === 'blank') return cv;

  if (face.kind === 'cover') {
    // The film's end card: the logo on pure white, centred, as the hero film holds it.
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, W, H);
    const logo = assets.logo;
    if (logo && logo.naturalWidth) {
      const lw = Math.round(W * 0.62), lh = Math.round((lw * logo.naturalHeight) / logo.naturalWidth);
      c.drawImage(logo, Math.round((W - lw) / 2), Math.round((H - lh) / 2), lw, lh);
    }
    return cv;
  }

  if (face.kind === 'photo') {
    if (assets.photo) coverFit(c, assets.photo, 0, 0, W, H, assets.focus);
    return cv;
  }

  const folio = (text: string) => {
    c.fillStyle = MUTED;
    c.font = font(500, 18);
    c.fillText(text, M, H - px(60));
  };

  if (face.kind === 'story') {
    const w = face.words;
    c.fillStyle = INK;
    c.font = font(500, 21);
    c.fillText(w.label, M, M + px(20));
    c.fillStyle = NAVY;
    c.font = font(600, 58);
    let y = wrap(c, w.lede, M, Math.round(H * 0.3), W - M * 2, px(64)) + px(26);
    c.fillStyle = INK;
    c.font = font(400, 30);
    y = wrap(c, w.para, M, y, W - M * 2, px(44)) + px(30);
    c.fillStyle = NAVY;
    c.font = font(500, 34);
    wrap(c, w.count, M, y, W - M * 2, px(46));
    folio(face.folio);
    return cv;
  }

  if (face.kind === 'portrait') {
    const pw = W - M * 2, ph = Math.round((pw * 500) / 360);
    portraitSlot(c, M, Math.round((H - ph) / 2), pw, ph);
    folio(face.folio);
    return cv;
  }

  // A member. The label at the top, then — one page at a time — the slot a landscape
  // crop would fill, as the card had it on a phone; then the role, the name, the line.
  const m = face.member;
  c.fillStyle = INK;
  c.font = font(500, 21);
  c.fillText(face.label, M, M + px(20));
  let y = M + px(190);
  if (face.portrait) {
    const pw = W - M * 2, ph = Math.round((pw * 3) / 4);
    portraitSlot(c, M, M + px(130), pw, ph);
    y = M + px(130) + ph + px(70);
  }
  c.fillStyle = MUTED;
  c.font = font(500, 19);
  c.fillText(tracked(m.role), M, y);
  c.fillStyle = NAVY;
  c.font = font(200, 70);
  c.fillText(m.first, M, y + px(92));
  c.font = font(400, 70);
  c.fillText(m.last, M, y + px(168));
  c.fillStyle = INK;
  c.font = font(400, 28);
  wrap(c, m.bio, M, y + px(250), W - M * 2 - px(40), px(44));
  folio(face.folio);
  return cv;
}
