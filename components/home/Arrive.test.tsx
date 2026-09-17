import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Arrive } from './Arrive';

// jsdom lays nothing out, so every element's rect is zero, which would put it under the tip line the instant it mounts; stub it far below so "not yet arrived" holds here.
beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    top: 5000, bottom: 5100, left: 0, right: 0, width: 0, height: 100, x: 0, y: 5000, toJSON() {},
  }) as DOMRect);
});
afterEach(() => vi.restoreAllMocks());

describe('Arrive', () => {
  test('renders the element asked for with its attributes, live once mounted, not yet arrived', () => {
    render(
      <Arrive as="section" id="om-oss" aria-labelledby="om-oss-tittel" className="white">
        <h2 id="om-oss-tittel" data-title>Om oss</h2>
      </Arrive>,
    );
    const section = screen.getByRole('heading', { name: 'Om oss' }).closest('section') as HTMLElement;
    expect(section).toHaveAttribute('id', 'om-oss');
    expect(section).toHaveAttribute('aria-labelledby', 'om-oss-tittel');
    expect(section.className).toContain('white');
    expect(section).toHaveAttribute('data-arrive');
    expect(section).toHaveAttribute('data-live');
    expect(section).not.toHaveAttribute('data-arrived');
  });

  test('is a div unless told otherwise', () => {
    render(<Arrive><p>x</p></Arrive>);
    expect(screen.getByText('x').parentElement?.tagName).toBe('DIV');
  });
});
