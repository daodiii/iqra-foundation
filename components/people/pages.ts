/**
 * The faces of the book on the landing page, and how each is painted for the renderer.
 * Set on the same cream stock, in the same face and to the same margins as the book on
 * `/om-oss` (`components/about/pages.ts`); only what is printed on the pages is this
 * section's — the logo, the words the section used to set in a frame, and the team one
 * person to a spread, which is what the member card used to be.
 *
 * `faces()` is pure so the pairing can be tested: the renderer turns leaves, and leaf i
 * shows faces[2i] on its front and faces[2i+1] on its back, so at an integer progress i
 * the open spread is [faces[2i-1] | faces[2i]]. Progress 0 would be the closed book, and
 * the book is never there: it stands open at 1 from the start («you should never see the
 * cover», 2026-09-14), so the front of leaf 0 is never turned to the eye and is blank.
 */
import { HAIRLINE, INK, type Member, MUTED, NAVY, STOCK, wrap } from '@/components/about/pages';
import { site } from '@/content/site.no';

const [story, menneskene] = site.about.chapters;

export type Words = { label: string; lede: string; para: string; count: string };

export type PeopleFace =
  /** The film's end card: the logo on pure white. The left page of the first spread. */
  | { kind: 'logo' }
  | { kind: 'story'; words: Words; folio: string }
  /** The portrait slot on its own page, facing the member's words. */
  | { kind: 'portrait'; index: number; folio: string }
  /** One member: the label «Teamet · k / n», the role, the name, the line — and on one page
   *  at a time, the portrait slot above them, since there is no facing page to hold it. */
  | { kind: 'member'; member: Member; index: number; label: string; portrait: boolean; folio: string }
  | { kind: 'blank' };

/** Member k (0-based) is the spread after the words: the words are at 1, so k is at k + 2. */
export const progressFor = (index: number) => index + 2;
/** The member a progress is showing, or -1 for the first spread. */
export const indexAt = (p: number) => Math.max(-1, Math.round(p) - 2);

/**
 * A spread: [blank] · [logo | the words] · [portrait k | member k] for every member, and
 * one blank to close the last leaf. One page at a time (the phone): every page on the
 * right of its leaf and a blank on every back, so each turn shows a cream reverse and
 * lands on the next page — [blank] · [blank | logo] · [blank | member k]. On both, the
 * words are at 1 and member k at k + 2, so the rings and the label need not know which.
 */
export function faces(single: boolean): PeopleFace[] {
  const words: Words = {
    label: site.about.label, lede: story.lede, para: story.paras[0], count: menneskene.paras[0],
  };
  const team = menneskene.team;
  // The front of leaf 0: never seen, since the book is never closed.
  const out: PeopleFace[] = [{ kind: 'blank' }];
  // The words are page 2 on a spread; one page at a time, the logo is, unnumbered.
  let folio = single ? 3 : 2;
  if (single) {
    out.push({ kind: 'blank' }, { kind: 'logo' }, { kind: 'blank' });
    team.forEach((member, index) => {
      out.push(
        { kind: 'member', member, index, label: memberLabel(index, team.length), portrait: true, folio: String(folio++) },
        { kind: 'blank' },
      );
    });
  } else {
    out.push({ kind: 'logo' }, { kind: 'story', words, folio: String(folio++) });
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

/** What the painter needs that is not content: the face, and the logo. */
export type Assets = {
  /** The page's own family, read off the document — `next/font` names it, not us. */
  family: string;
  logo: HTMLImageElement | null;
};

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

  if (face.kind === 'logo') {
    // The film's end card: the logo on pure white, centred, as the hero film holds it.
    // It was the cover; now it is the first page, and the book is open on it.
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, W, H);
    const logo = assets.logo;
    if (logo && logo.naturalWidth) {
      const lw = Math.round(W * 0.62), lh = Math.round((lw * logo.naturalHeight) / logo.naturalWidth);
      c.drawImage(logo, Math.round((W - lw) / 2), Math.round((H - lh) / 2), lw, lh);
    }
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
  /*
   * The rhythm under the role's baseline: the two names, then the line. One page at a
   * time carries the slot as well, so it sets everything a step smaller and closer, or
   * the line runs into the folio — which is what the first cut did, and read as a
   * broken bracket at the start of every bio.
   */
  const r = face.portrait
    ? { name: 64, first: 84, last: 154, line: 26, at: 222, lh: 38 }
    : { name: 70, first: 92, last: 168, line: 28, at: 250, lh: 44 };
  let y = M + px(190);
  if (face.portrait) {
    const pw = W - M * 2, ph = Math.round((pw * 2) / 3);
    portraitSlot(c, M, M + px(110), pw, ph);
    y = M + px(110) + ph + px(66);
  }
  c.fillStyle = MUTED;
  c.font = font(500, 19);
  c.fillText(tracked(m.role), M, y);
  c.fillStyle = NAVY;
  c.font = font(200, r.name);
  c.fillText(m.first, M, y + px(r.first));
  c.font = font(400, r.name);
  c.fillText(m.last, M, y + px(r.last));
  c.fillStyle = INK;
  c.font = font(400, r.line);
  const after = wrap(c, m.bio, M, y + px(r.at), W - M * 2 - px(40), px(r.lh));
  // The folio only where the line leaves it room; a number printed through a sentence is worse than none.
  if (after < H - px(90)) folio(face.folio);
  return cv;
}
