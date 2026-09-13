import { expect, test, vi } from 'vitest';
import { createGoldFilm, WRITE_SECONDS, writeEase, written } from './gold';

/*
 * jsdom has no media pipeline: play() and pause() are unimplemented stubs. The film's
 * element is built by hand with the two things `createGoldFilm` calls.
 */
function film() {
  const video = document.createElement('video');
  const play = vi.fn(() => Promise.resolve());
  const pause = vi.fn();
  Object.defineProperty(video, 'play', { value: play });
  Object.defineProperty(video, 'pause', { value: pause });
  return { video, play, pause };
}

test('the written curve starts empty, ends whole, and never goes backwards', () => {
  expect(written(0)).toBe(0);
  expect(written(-1)).toBe(0);
  expect(written(WRITE_SECONDS)).toBe(1);
  expect(written(10)).toBe(1);
  let last = 0;
  for (let t = 0; t <= WRITE_SECONDS; t += 0.05) {
    const w = written(t);
    expect(w).toBeGreaterThanOrEqual(last);
    last = w;
  }
  // Between samples the curve interpolates rather than steps: this is not a value on the list.
  expect(written(1.625)).toBeCloseTo((0.29 + 0.48) / 2, 5);
});

test('the ease maps timeline progress onto the film: 0 → 0, 1 → 1', () => {
  expect(writeEase(0)).toBe(0);
  expect(writeEase(1)).toBe(1);
  expect(writeEase(0.5)).toBeCloseTo(written(WRITE_SECONDS / 2), 5);
});

test('play() starts the film from its first frame, muted, without loop — and only once', () => {
  const { video, play } = film();
  video.loop = true;
  const gold = createGoldFilm(video, { reduced: false });
  gold.play();
  expect(video.loop).toBe(false);
  expect(video.muted).toBe(true);
  expect(video.currentTime).toBe(0);
  expect(play).toHaveBeenCalledTimes(1);
  // The word stays: nothing listens for the end, so an ended film is a finished one.
  video.currentTime = 5;
  video.dispatchEvent(new Event('ended'));
  expect(play).toHaveBeenCalledTimes(1);
  expect(video.currentTime).toBe(5);
  gold.destroy();
});

test('under reduced motion the finished word is shown and nothing plays', () => {
  const { video, play, pause } = film();
  const gold = createGoldFilm(video, { reduced: true });
  gold.play();
  expect(play).not.toHaveBeenCalled();
  expect(pause).toHaveBeenCalled();
  expect(video.currentTime).toBeCloseTo(4.9, 5);
  gold.destroy();
});
