import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { centreOf, useGlide } from './glide';

const realMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = realMatchMedia; });

describe('centreOf', () => {
  test('an element’s centre in screen heights; a tall one is judged by its first four fifths of a screen', () => {
    const rect = (top: number, height: number) => ({ top, height } as DOMRect);
    expect(centreOf(rect(450, 0), 900)).toBe(0.5);
    expect(centreOf(rect(400, 200), 900)).toBeCloseTo(500 / 900, 10);
    expect(centreOf(rect(0, 3000), 900)).toBe(0.4);
  });
});

/** A probe: the value written as `--v`, from a target the test controls; the screen heights it was judged by. */
let target = 0;
let heights: number[] = [];
function Probe({ onWrite, mark }: { onWrite?: (v: number) => void; mark?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGlide(ref, (_r, H) => { heights.push(H); return target; }, (v, el) => { el.style.setProperty('--v', v.toFixed(3)); onWrite?.(v); }, mark);
  return <div ref={ref} data-testid="el" />;
}

/** The window's size, as a resize would leave it. */
const size = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
};
/** matchMedia answering `true` for the queries in `yes`. */
const media = (yes: string[]) => {
  window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: yes.includes(q) })) as typeof window.matchMedia;
};

describe('useGlide', () => {
  let sized: [PropertyDescriptor | undefined, PropertyDescriptor | undefined];
  beforeEach(() => {
    target = 0;
    heights = [];
    sized = [Object.getOwnPropertyDescriptor(window, 'innerWidth'), Object.getOwnPropertyDescriptor(window, 'innerHeight')];
    size(390, 700);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    const back = (name: 'innerWidth' | 'innerHeight', was: PropertyDescriptor | undefined) => {
      if (was) Object.defineProperty(window, name, was);
      else delete (window as unknown as Record<string, unknown>)[name];
    };
    back('innerWidth', sized[0]);
    back('innerHeight', sized[1]);
  });
  const scroll = () => act(() => { window.dispatchEvent(new Event('scroll')); });
  const resize = () => act(() => { window.dispatchEvent(new Event('resize')); });

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

  test('a scroll writes the value where the page is, at once: no frames of its own, nothing easing after it', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    const writes: number[] = [];
    const { getByTestId } = render(<Probe onWrite={(v) => writes.push(v)} />);
    target = 0.4;
    scroll();
    expect(getByTestId('el').style.getPropertyValue('--v')).toBe('0.400');
    target = 0.7;
    scroll();
    expect(writes).toEqual([0, 0.4, 0.7]);
    expect(raf).not.toHaveBeenCalled();
  });

  test('nothing is written when nothing has changed', () => {
    const writes: number[] = [];
    render(<Probe onWrite={(v) => writes.push(v)} />);
    scroll();
    scroll();
    expect(writes).toEqual([0]);
  });

  test('a phone’s toolbar, changing the height alone, leaves the screen it is judged by; a turn of the phone, changing the width, takes the new one', () => {
    render(<Probe />);
    expect(heights.at(-1)).toBe(700);
    size(390, 756); // the toolbar hides as the page scrolls
    resize();
    scroll();
    expect(heights.at(-1)).toBe(700);
    size(700, 390); // turned on its side
    resize();
    expect(heights.at(-1)).toBe(390);
  });

  test('a precise pointer’s screen has no such toolbar: every new height is taken', () => {
    media(['(pointer: fine)']);
    render(<Probe />);
    size(390, 640);
    resize();
    expect(heights.at(-1)).toBe(640);
  });

  test('under reduced motion nothing is driven: no write, no mark, no listener', () => {
    media(['(prefers-reduced-motion: reduce)']);
    const on = vi.spyOn(window, 'addEventListener');
    const writes: number[] = [];
    const { getByTestId } = render(<Probe onWrite={(v) => writes.push(v)} mark="data-driven" />);
    expect(writes).toEqual([]);
    expect(getByTestId('el')).not.toHaveAttribute('data-driven');
    expect(on).not.toHaveBeenCalledWith('resize', expect.anything());
  });

  test('unmounting stops listening: a scroll or a resize after it writes nothing', () => {
    const off = vi.spyOn(window, 'removeEventListener');
    const writes: number[] = [];
    const { unmount } = render(<Probe onWrite={(v) => writes.push(v)} />);
    unmount();
    expect(off).toHaveBeenCalledWith('resize', expect.anything());
    target = 1;
    scroll();
    resize();
    expect(writes).toEqual([0]);
  });
});
