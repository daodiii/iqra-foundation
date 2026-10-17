import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useArrive } from './tip';

/** An element whose top is 1000px down the page, in a 900px window — unless a test stands it elsewhere. */
const TOP = 1000;
let top = TOP;
const realMatchMedia = window.matchMedia;

function Probe({ onChange, seen }: { onChange?: (arrived: boolean) => void; seen?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useArrive(ref, onChange, { seen });
  // On a plate (a scene), as the seal's content stands on its plate.
  return (
    <div data-scene="">
      <div ref={ref} data-testid="el">x</div>
    </div>
  );
}

/** The plate: it starts 50px above the element and is 800px tall. */
const PLATE = { above: 50, height: 800 };

const scrollTo = (y: number) => {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
  act(() => { window.dispatchEvent(new Event('scroll')); });
};

beforeEach(() => {
  top = TOP;
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const scene = this.hasAttribute('data-scene');
    const y = top - window.scrollY - (scene ? PLATE.above : 0);
    const height = scene ? PLATE.height : 100;
    return { top: y, bottom: y + height, left: 0, right: 0, width: 0, height, x: 0, y, toJSON() {} } as DOMRect;
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  window.matchMedia = realMatchMedia;
});

describe('useArrive', () => {
  test('arrives when the tip (70% down the screen) passes the top + 32, and leaves 120px above it', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(<Probe onChange={onChange} />);
    const el = getByTestId('el');
    expect(el).not.toHaveAttribute('data-arrived');
    // tip = scrollY + 630; arrives at tip >= 1032, i.e. scrollY >= 402
    scrollTo(395);
    expect(el).not.toHaveAttribute('data-arrived');
    scrollTo(405);
    expect(el).toHaveAttribute('data-arrived');
    expect(onChange).toHaveBeenLastCalledWith(true);
    // leaves at tip < 880, i.e. scrollY < 250: not yet
    scrollTo(300);
    expect(el).toHaveAttribute('data-arrived');
    scrollTo(200);
    expect(el).not.toHaveAttribute('data-arrived');
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  test('with `seen`, it arrives once that share of its plate is on the screen, and leaves when the screen’s foot goes back 120px above that', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(<Probe onChange={onChange} seen={0.25} />);
    const el = getByTestId('el');
    expect(el).not.toHaveAttribute('data-arrived');
    // the plate's top at 950, a quarter of it 200 down: arrives at scrollY + 900 >= 1150, i.e. scrollY >= 250 (the tip would wait for 402)
    scrollTo(245);
    expect(el).not.toHaveAttribute('data-arrived');
    scrollTo(250);
    expect(el).toHaveAttribute('data-arrived');
    expect(onChange).toHaveBeenLastCalledWith(true);
    // leaves at scrollY + 900 < 1030, i.e. scrollY < 130: not yet
    scrollTo(140);
    expect(el).toHaveAttribute('data-arrived');
    scrollTo(120);
    expect(el).not.toHaveAttribute('data-arrived');
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  test('with `seen`, a page that opens with the plate only peeking in waits for the mark rather than arriving at mount', () => {
    // opened at scrollY 200: the element's top at 800 on a 900 screen, inside it; the screen's foot at 1100, short of the mark at 1150
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 200 });
    const onChange = vi.fn();
    const { getByTestId } = render(<Probe onChange={onChange} seen={0.25} />);
    expect(getByTestId('el')).not.toHaveAttribute('data-arrived');
    expect(onChange).not.toHaveBeenCalled();
    scrollTo(250);
    expect(getByTestId('el')).toHaveAttribute('data-arrived');
  });

  test('with `seen`, a height-only resize on a phone (its toolbar showing) does not move the line: the seal is not cleared and drawn again', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(<Probe onChange={onChange} seen={0.25} />);
    scrollTo(260);
    expect(getByTestId('el')).toHaveAttribute('data-arrived');
    // the toolbar shows (900 to 760) on a scroll back up to 200: judged live the foot would be at 960, below the leaving line at 1030
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 760 });
    act(() => { window.dispatchEvent(new Event('resize')); });
    scrollTo(200);
    expect(getByTestId('el')).toHaveAttribute('data-arrived');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('what stands on the first screen is already there: arrived on mount, told once, and a scroll does not clear it', () => {
    top = 600;
    const onChange = vi.fn();
    const { getByTestId } = render(<Probe onChange={onChange} />);
    expect(getByTestId('el')).toHaveAttribute('data-arrived');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
    scrollTo(0);
    scrollTo(100);
    expect(getByTestId('el')).toHaveAttribute('data-arrived');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('an element on the first screen but below the tip’s leaving line stays through a scroll and back', () => {
    // The phone's case: the mosaic's top at 723 in an 844 window, the tip at 591, the leaving
    // line at 603. Here: top 800, tip 630, leaving line 680 — the tip rule alone would clear
    // it on the first scroll and hold it blank until scrollY 254.
    top = 800;
    const onChange = vi.fn();
    const { getByTestId } = render(<Probe onChange={onChange} />);
    expect(getByTestId('el')).toHaveAttribute('data-arrived');
    scrollTo(10);
    expect(getByTestId('el')).toHaveAttribute('data-arrived');
    scrollTo(400);
    scrollTo(0);
    expect(getByTestId('el')).toHaveAttribute('data-arrived');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('the first screen is judged once, at mount: a viewport shrinking under the element (the address bar collapsing) does not clear it', () => {
    // The phone's own numbers: the mosaic's top at 723 in an 844 window; the bar collapses to 700.
    top = 723;
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });
    const onChange = vi.fn();
    const { getByTestId } = render(<Probe onChange={onChange} />);
    expect(getByTestId('el')).toHaveAttribute('data-arrived');
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 });
    act(() => { window.dispatchEvent(new Event('resize')); });
    expect(getByTestId('el')).toHaveAttribute('data-arrived');
    scrollTo(0);
    expect(getByTestId('el')).toHaveAttribute('data-arrived');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('below the first screen it waits for the tip', () => {
    top = 5000;
    const onChange = vi.fn();
    const { getByTestId } = render(<Probe onChange={onChange} />);
    expect(getByTestId('el')).not.toHaveAttribute('data-arrived');
    expect(onChange).not.toHaveBeenCalled();
  });

  test('under reduced motion it is arrived at once and left alone', () => {
    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
    const onChange = vi.fn();
    const { getByTestId } = render(<Probe onChange={onChange} />);
    expect(getByTestId('el')).toHaveAttribute('data-arrived');
    expect(onChange).toHaveBeenCalledWith(true);
    scrollTo(0);
    expect(getByTestId('el')).toHaveAttribute('data-arrived');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
