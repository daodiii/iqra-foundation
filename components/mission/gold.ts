/*
 * The gold film: a pen writes اقرأ in molten gold on the night, once, in about three and a
 * half seconds, and holds. It is played once, when the section arrives, and the finished
 * word stays («film does it once», 2026-09-13; a cycle that let the night fall and wrote it
 * again was built and taken out the same day). The section's own pens — the frames round
 * its boxes — keep pace with it through `written`.
 */

/**
 * How much of the word is down `t` seconds into the film, 0..1.
 *
 * Read off the film once rather than guessed: every frame at 320×180, the gold pixels
 * counted against the finished word's (the mocks' `pen-track.mjs`, 2026-09-13). The pen
 * lands at 0.46 s, the two tall strokes come first and quickly, the middle slower, the
 * final swoop lands at 3.4 s. Sampled every quarter second; the frames' pens ease along
 * this curve so a stroke of the frame lands when a stroke of the word does.
 */
const CURVE: readonly (readonly [t: number, w: number])[] = [
  [0, 0], [0.5, 0.06], [0.75, 0.13], [1, 0.13], [1.25, 0.17], [1.5, 0.29], [1.75, 0.48],
  [2, 0.58], [2.25, 0.7], [2.5, 0.74], [2.75, 0.83], [3, 0.91], [3.25, 0.99], [3.5, 1],
];

/** When the word is whole. Everything the section times against the film uses this. */
export const WRITE_SECONDS = 3.5;

export function written(t: number): number {
  if (t <= 0) return 0;
  if (t >= WRITE_SECONDS) return 1;
  let i = 0;
  while (i < CURVE.length - 2 && CURVE[i + 1][0] <= t) i++;
  const [t0, w0] = CURVE[i];
  const [t1, w1] = CURVE[i + 1];
  return w0 + ((w1 - w0) * (t - t0)) / (t1 - t0);
}

/** GSAP takes a function as an ease: progress in, progress out. The film's curve, as one. */
export const writeEase = (p: number): number => written(p * WRITE_SECONDS);

export type GoldFilm = {
  /** From the start: the pen lands, the word is written, and it stays. */
  play(): void;
  destroy(): void;
};

/**
 * The film, played once. Muted and unlooped whatever the markup says, because a loop would
 * write the word again and a sound would be a surprise. Under reduced motion the film is
 * shown finished and left there: one seek, no play.
 */
export function createGoldFilm(video: HTMLVideoElement, opts: { reduced: boolean }): GoldFilm {
  video.loop = false;
  video.muted = true;
  return {
    play() {
      if (opts.reduced) {
        // The finished word, held. 4.9 s is inside the film's last, settled second.
        video.pause();
        video.currentTime = 4.9;
        return;
      }
      video.currentTime = 0;
      // play() returns a promise in browsers and nothing in jsdom; either way a refusal is
      // not an error here — the frames still draw and the film sits on its first frame.
      void Promise.resolve(video.play()).catch(() => {});
    },
    destroy() {
      video.pause();
    },
  };
}
