import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useArrive } from './tip';

/** An element whose top is 1000px down the page, in a 900px window. */
const TOP = 1000;
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
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const top = TOP - window.scrollY;
    return { top, bottom: top + 100, left: 0, right: 0, width: 0, height: 100, x: 0, y: top, toJSON() {} } as DOMRect;
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
