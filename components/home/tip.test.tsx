import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useArrive } from './tip';

/** An element whose top is 1000px down the page, in a 900px window — unless a test stands it elsewhere. */
const TOP = 1000;
let top = TOP;
const realMatchMedia = window.matchMedia;

function Probe({ onChange }: { onChange?: (arrived: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useArrive(ref, onChange);
  return <div ref={ref} data-testid="el">x</div>;
}

const scrollTo = (y: number) => {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
  act(() => { window.dispatchEvent(new Event('scroll')); });
};

beforeEach(() => {
  top = TOP;
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const y = top - window.scrollY;
    return { top: y, bottom: y + 100, left: 0, right: 0, width: 0, height: 100, x: 0, y, toJSON() {} } as DOMRect;
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  window.matchMedia = realMatchMedia;
});

describe('useArrive', () => {
  test('arrives when the tip (66% down the screen) passes the top + 48, and leaves 120px above it', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(<Probe onChange={onChange} />);
    const el = getByTestId('el');
    expect(el).not.toHaveAttribute('data-arrived');
    // tip = scrollY + 594; arrives at tip >= 1048, i.e. scrollY >= 454
    scrollTo(450);
    expect(el).not.toHaveAttribute('data-arrived');
    scrollTo(460);
    expect(el).toHaveAttribute('data-arrived');
    expect(onChange).toHaveBeenLastCalledWith(true);
    // leaves at tip < 880, i.e. scrollY < 286: not yet
    scrollTo(300);
    expect(el).toHaveAttribute('data-arrived');
    scrollTo(200);
    expect(el).not.toHaveAttribute('data-arrived');
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(2);
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
    // The phone's case: the mosaic's top at 723 in an 844 window, the tip at 557, the leaving
    // line at 603. Here: top 800, tip 594, leaving line 680 — the tip rule alone would clear
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
