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
