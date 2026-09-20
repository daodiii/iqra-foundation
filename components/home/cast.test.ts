import { describe, expect, test } from 'vitest';
import { CAST_W, coverOf, frameOf, LOCKUP_ASPECT, makeCast } from './cast';
import { LOCKUP_VIEWBOX } from './lockup';

describe('the cast', () => {
  test('the lockup’s aspect is its viewBox’s', () => {
    const [, , w, h] = LOCKUP_VIEWBOX.split(' ').map(Number);
    expect(LOCKUP_ASPECT).toBeCloseTo(w / h, 6);
  });

  test('the cover crop: a frame taller than the box loses its top and bottom, a wider one its sides, centred', () => {
    // 16:9 is taller than the lockup's box (1.82): the full width, a band of the height.
    const [sx, sy, sw, sh] = coverOf(1920, 1080);
    expect(sx).toBe(0);
    expect(sw).toBe(1920);
    expect(sh).toBeCloseTo(1920 / LOCKUP_ASPECT, 6);
    expect(sy).toBeCloseTo((1080 - sh) / 2, 6);
    // Wider than the box: the full height, a band of the width.
    const [wx, wy, ww, wh] = coverOf(3000, 1000);
    expect(wy).toBe(0);
    expect(wh).toBe(1000);
    expect(ww).toBeCloseTo(1000 * LOCKUP_ASPECT, 6);
    expect(wx).toBeCloseTo((3000 - ww) / 2, 6);
  });

  test('the frame is the video while it plays, the poster while it does not, and nothing before either has a size', () => {
    const poster = { naturalWidth: 1280, naturalHeight: 720 } as HTMLImageElement;
    const blank = { naturalWidth: 0, naturalHeight: 0 } as HTMLImageElement;
    const playing = { readyState: 4, paused: false, videoWidth: 1920, videoHeight: 1080 } as HTMLVideoElement;
    const waiting = { readyState: 1, paused: true, videoWidth: 0, videoHeight: 0 } as HTMLVideoElement;
    const refused = { readyState: 4, paused: true, videoWidth: 1920, videoHeight: 1080 } as HTMLVideoElement;
    expect(frameOf(playing, poster)).toEqual({ src: playing, w: 1920, h: 1080 });
    expect(frameOf(waiting, poster)).toEqual({ src: poster, w: 1280, h: 720 });
    // Autoplay refused: decoded but paused, so the poster stands in for it.
    expect(frameOf(refused, poster)).toEqual({ src: poster, w: 1280, h: 720 });
    expect(frameOf(waiting, blank)).toBeNull();
  });

  test('the canvas is sized to the lockup’s box at the cast’s width, and a frame of nothing draws nothing', () => {
    const c = document.createElement('canvas');
    const draw = makeCast(c, '#ab5261');
    expect(c.width).toBe(CAST_W);
    expect(c.height).toBe(Math.round(CAST_W / LOCKUP_ASPECT));
    expect(() => draw(null)).not.toThrow();
  });
});
