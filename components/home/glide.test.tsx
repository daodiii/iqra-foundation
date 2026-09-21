import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { centreOf, gain, LAG, useGlide } from './glide';

const realMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = realMatchMedia; });

describe('gain and centreOf', () => {
  test('a frame goes a fixed share of the way: a sixtieth of a second a tenth, three and a half lags ninety per cent, nothing in no time', () => {
    expect(gain(0)).toBe(0);
    expect(gain(16.7)).toBeCloseTo(0.105, 2);
    expect(gain(3.5 * LAG)).toBeCloseTo(0.97, 2);
    expect(gain(LAG, LAG)).toBeCloseTo(1 - 1 / Math.E, 5);
  });

  test('an element’s centre in screen heights; a tall one is judged by its first four fifths of a screen', () => {
    const rect = (top: number, height: number) => ({ top, height } as DOMRect);
    expect(centreOf(rect(450, 0), 900)).toBe(0.5);
    expect(centreOf(rect(400, 200), 900)).toBeCloseTo(500 / 900, 10);
    expect(centreOf(rect(0, 3000), 900)).toBe(0.4);
  });
});

/** A probe: the value written as `--v`, from a target the test controls. */
let target = 0;
function Probe({ onWrite, mark }: { onWrite?: (v: number) => void; mark?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGlide(ref, () => target, (v, el) => { el.style.setProperty('--v', v.toFixed(3)); onWrite?.(v); }, mark);
  return <div ref={ref} data-testid="el" />;
}

describe('useGlide', () => {
  let now = 0;
  beforeEach(() => {
    now = 0;
    target = 0;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  const scroll = () => act(() => { window.dispatchEvent(new Event('scroll')); });
  /** Frames that run at once, a sixtieth of a second apart, and report nothing pending. */
  const framesAtOnce = () => vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { now += 16.7; cb(now); return 0; });

  test('at mount the value stands where the target is, written once, and the mark is set', () => {
    target = 0.6;
    const writes: number[] = [];
    const { getByTestId, unmount } = render(<Probe onWrite={(v) => writes.push(v)} mark="data-driven" />);
    const el = getByTestId('el');
    expect(el.style.getPropertyValue('--v')).toBe('0.600');
    expect(writes).toEqual([0.6]);
    expect(el).toHaveAttribute('data-driven');
    unmount();
    expect(el).not.toHaveAttribute('data-driven');
  });

  test('a scroll moves the value toward the new target frame by frame — a tenth of the way a frame — and lands on it', () => {
    framesAtOnce();
    const writes: number[] = [];
    const { getByTestId } = render(<Probe onWrite={(v) => writes.push(v)} />);
    target = 1;
    scroll();
    // the frames ran at once: the value has landed
    expect(getByTestId('el').style.getPropertyValue('--v')).toBe('1.000');
    // and got there by degrees: the first frame (a frame's worth, having no last one to measure from) a tenth of the way, each one closer, never past
    const path = writes.slice(1);
    expect(path[0]).toBeCloseTo(gain(16), 5);
    for (let i = 1; i < path.length; i++) expect(path[i]).toBeGreaterThan(path[i - 1]);
    expect(path[path.length - 1]).toBe(1);
    expect(path.length).toBeGreaterThan(20);
    expect(path.length).toBeLessThan(100);
  });

  test('the target is read on the scroll, not on the frame, and a frame that lands writes the target exactly', () => {
    let reads = 0;
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 7);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    function P() {
      const ref = useRef<HTMLDivElement>(null);
      useGlide(ref, () => { reads++; return target; }, () => {});
      return <div ref={ref} />;
    }
    render(<P />);
    expect(reads).toBe(1);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));
    });
    expect(reads).toBe(4);
    // one frame for the burst
    expect(raf).toHaveBeenCalledTimes(1);
  });

  test('frames keep going after the scroll has stopped until the value has settled, then stop', () => {
    const pending: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { pending.push(cb); return pending.length; });
    render(<Probe />);
    target = 1;
    scroll();
    let frames = 0;
    while (pending.length && frames < 200) {
      const cb = pending.shift()!;
      now += 16.7;
      act(() => cb(now));
      frames++;
    }
    expect(frames).toBeGreaterThan(20);
    expect(frames).toBeLessThan(100);
    expect(pending).toHaveLength(0);
  });

  test('a long gap between frames (a hidden tab) counts as one frame, not a jump', () => {
    const pending: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { pending.push(cb); return pending.length; });
    const writes: number[] = [];
    render(<Probe onWrite={(v) => writes.push(v)} />);
    target = 1;
    scroll();
    act(() => pending.shift()!(5000));
    act(() => pending.shift()!(9000));
    expect(writes[1]).toBeCloseTo(gain(16), 5);
    expect(writes[2]).toBeCloseTo(gain(16) + (1 - gain(16)) * gain(16), 5);
  });

  test('under reduced motion nothing is driven: no write, no mark, no listener', () => {
    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
    const on = vi.spyOn(window, 'addEventListener');
    const writes: number[] = [];
    const { getByTestId } = render(<Probe onWrite={(v) => writes.push(v)} mark="data-driven" />);
    expect(writes).toEqual([]);
    expect(getByTestId('el')).not.toHaveAttribute('data-driven');
    expect(on).not.toHaveBeenCalledWith('scroll', expect.anything(), expect.anything());
  });

  test('unmounting removes the listeners and cancels the pending frame', () => {
    const off = vi.spyOn(window, 'removeEventListener');
    const caf = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 7);
    const { unmount } = render(<Probe />);
    scroll();
    unmount();
    expect(off).toHaveBeenCalledWith('scroll', expect.anything());
    expect(off).toHaveBeenCalledWith('resize', expect.anything());
    expect(caf).toHaveBeenCalledWith(7);
  });
});
