import { describe, expect, test } from 'vitest';
import { createFrame, FRAME_PAD, framePath, keepFramesFitted, legendGap, LEGEND_ROOM } from './pen';

const near = (a: [number, number], b: [number, number], tol = 0.5) => {
  expect(Math.hypot(a[0] - b[0], a[1] - b[1]), `${a} is not near ${b}`).toBeLessThan(tol);
};

describe('framePath', () => {
  const W = 300, H = 200, r = 10;
  const straight = 2 * (W - 2 * r) + 2 * (H - 2 * r);
  const corners = 2 * Math.PI * r;

  test('with a gap: the perimeter less the gap, starting after the legend and ending before it', () => {
    const path = framePath(W, H, r, { from: 40, to: 120 });
    expect(path.length).toBeCloseTo(straight + corners - (120 - 40), 4);
    near(path.pointAt(0), [120, 0]);
    near(path.pointAt(1), [40, 0]);
  });

  test('goes clockwise: the right side comes before the bottom, and the bottom edge is whole', () => {
    const path = framePath(W, H, r, { from: 40, to: 120 });
    // the top edge from 120 to 290, then the arc, then the right side: its middle is on the path
    const toRightMid = (W - r - 120) + (Math.PI * r) / 2 + (H / 2 - r);
    near(path.pointAt(toRightMid / path.length), [W, H / 2]);
    // no gap on the bottom edge — a button sits over it, the line running on beneath
    const toBottomMid = toRightMid + (H / 2 - r) + (Math.PI * r) / 2 + (W / 2 - r);
    near(path.pointAt(toBottomMid / path.length), [W / 2, H]);
  });

  test('without a gap: closed, starting where the top-left arc ends', () => {
    const path = framePath(W, H, r);
    expect(path.length).toBeCloseTo(straight + corners, 4);
    near(path.pointAt(0), [r, 0]);
    near(path.pointAt(1), [r, 0]);
  });
});

describe('legendGap', () => {
  test('is the legend’s box in the card’s coordinates with room either side', () => {
    const card = { left: 100, top: 50, right: 450, bottom: 250, width: 350, height: 200, x: 100, y: 50, toJSON() {} } as DOMRect;
    const legend = { left: 130, top: 37, right: 210, bottom: 63, width: 80, height: 26, x: 130, y: 37, toJSON() {} } as DOMRect;
    expect(legendGap(card, legend)).toEqual({ from: 30 - LEGEND_ROOM, to: 110 + LEGEND_ROOM });
  });
});

describe('createFrame', () => {
  const rect = (left: number, top: number, width: number, height: number) =>
    ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON() {} }) as DOMRect;
  const card = () => {
    const el = document.createElement('div');
    el.innerHTML = '<canvas data-frame-canvas></canvas><p data-legend>Om oss</p><p>copy</p>';
    document.body.appendChild(el);
    return el;
  };

  test('is null with no canvas in the card', () => {
    const el = document.createElement('div');
    expect(createFrame(el)).toBeNull();
  });

  test('is null where the canvas declines a 2D context', () => {
    const el = card();
    const canvas = el.querySelector('canvas')!;
    canvas.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
    expect(createFrame(el)).toBeNull();
    expect(el.hasAttribute('data-frame-drawn')).toBe(false);
  });

  test('a card that is not laid out draws nothing and never says it is drawn', () => {
    const el = card();
    const frame = createFrame(el)!;
    frame.layout(); // jsdom: every rect is 0 × 0
    frame.p = 1;
    frame.draw();
    expect(el.hasAttribute('data-frame-drawn')).toBe(false);
  });

  test('says when the line has closed, and takes it back when the pen is drawn back', () => {
    const el = card();
    el.getBoundingClientRect = () => rect(100, 50, 350, 200);
    el.querySelector<HTMLElement>('[data-legend]')!.getBoundingClientRect = () => rect(130, 37, 80, 26);
    const frame = createFrame(el)!;
    frame.layout();
    expect(el.hasAttribute('data-frame-drawn')).toBe(false);
    frame.p = 1;
    frame.draw();
    expect(el.getAttribute('data-frame-drawn')).toBe('true');
    frame.p = 0.5;
    frame.draw();
    expect(el.hasAttribute('data-frame-drawn')).toBe(false);
    const canvas = el.querySelector('canvas')!;
    // 32px of room on every side for the pen's glow, at the device's ratio (1 in jsdom)
    expect(canvas.width).toBe(350 + 2 * FRAME_PAD);
    expect(canvas.height).toBe(200 + 2 * FRAME_PAD);
    frame.destroy();
    expect(canvas.width).toBe(0);
  });

  test('draws its line with room for the glow: the pad is the pen’s tip and its halo', () => {
    expect(FRAME_PAD).toBe(32);
  });
});

describe('keepFramesFitted', () => {
  test('lays every frame out when the fonts land, again after a resize settles, and stops when released', async () => {
    const calls: number[] = [];
    const frames = [0, 1].map((i) => ({ p: 0, layout: () => { calls.push(i); }, draw() {}, destroy() {} }));
    const stop = keepFramesFitted(frames);
    await new Promise((r) => setTimeout(r, 0)); // document.fonts.ready
    expect(calls).toEqual([0, 1]);
    calls.length = 0;
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
    await new Promise((r) => setTimeout(r, 350));
    expect(calls).toEqual([0, 1]); // once, 300ms after the last
    stop();
    window.dispatchEvent(new Event('resize'));
    await new Promise((r) => setTimeout(r, 350));
    expect(calls).toEqual([0, 1]);
  });
});
