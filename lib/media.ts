/**
 * The hero film's name, and the name of every file cut from it (`scripts/media.mjs`
 * writes them). The files are cached for a year as immutable (`next.config.ts`), so a new
 * film has to be a new name: the second film went out under the first one's names on
 * 2026-09-20, and a returning visitor's browser kept showing the first for a month.
 */
export const FILM = 'iqra-ilm';

/** The still the letters show until the film has decoded: its first frame. */
export const POSTER = `/media/${FILM}-poster.jpg`;

/** Phones get 720p; WebM (VP9) is preferred wherever it plays. */
export function pickSource({ narrow, webm }: { narrow: boolean; webm: boolean }): string {
  return `/media/${FILM}-${narrow ? 720 : 1080}.${webm ? 'webm' : 'mp4'}`;
}

/**
 * The poster at the widths a screen asks for (scripts/dev/elite-media.mjs), AVIF and WebP: a phone
 * takes a 21 KB file where it took the 142 KB JPEG, which was its LCP element. `POSTER_SIZES` is
 * the lockup's box (hero.module.css `--mark-w`): 84vw on a phone, 54vw held back on a short screen.
 */
export const POSTER_WIDTHS = [480, 720, 960, 1280, 1600, 1920] as const;
export const posterSet = (type: 'avif' | 'webp') => POSTER_WIDTHS.map((w) => `/media/${FILM}-poster-${w}.${type} ${w}w`).join(', ');
export const POSTER_SIZES = '(max-width: 767px) 84vw, min(54vw, 66vh)';
export const POSTER_FALLBACK = `/media/${FILM}-poster-960.webp`;

/** STAND-IN (elite study): the film's modern study circle, baked into a navy duotone, under the closing question — until the foundation's own photograph exists. */
export const CIRCLE = { avif: `/media/${FILM}-krets-1600.avif`, webp: `/media/${FILM}-krets-1600.webp`, small: `/media/${FILM}-krets-960.webp` };
