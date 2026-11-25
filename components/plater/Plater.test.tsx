import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { Lines } from '@/components/forside/Lines';
import { Plate, Plater, closedAt, inset, partsFrom } from './Plater';

describe('Platene: a plate opens as it comes up', () => {
  test('closed while it waits under the screen, open once its top is three quarters up, and open past that', () => {
    expect(closedAt(1000, 1000)).toBe(1);
    expect(closedAt(2000, 1000)).toBe(1);
    expect(closedAt(250, 1000)).toBe(0);
    expect(closedAt(-500, 1000)).toBe(0);
    const half = closedAt(625, 1000);
    expect(half).toBeGreaterThan(0);
    expect(half).toBeLessThan(0.5); // eased out: it is more than half open halfway
  });

  test('closed, it is set in 10% of the height from the top, 7% of the width from each side, rounded 36 px; open, not at all', () => {
    expect(inset(1, 1000, 800)).toEqual({ top: 80, side: 70, round: 36 });
    expect(inset(0, 1000, 800)).toEqual({ top: 0, side: 0, round: 0 });
  });

  test('without an observer to wait for, every arriving text is shown', () => {
    const io = window.IntersectionObserver;
    // an old browser, with no IntersectionObserver (the stub is writable, not deletable)
    (window as { IntersectionObserver?: unknown }).IntersectionObserver = undefined;
    render(
      <Plater>
        <Plate tone="white" label="h">
          <h2 id="h">Tittel</h2>
          <p data-rise="">Tekst</p>
        </Plate>
      </Plater>,
    );
    expect(screen.getByRole('region', { name: 'Tittel' })).toHaveAttribute('data-plate', 'white');
    expect(screen.getByText('Tekst')).toHaveAttribute('data-in');
    window.IntersectionObserver = io;
  });

  /**
   * On a phone the page's parts stand over the content; built after loading, they pushed the whole
   * page down (CLS 0.17 on /om-oss, SEO audit 2026-11-25). They are read from the plates' own headings
   * as the page is rendered, so they are in the first paint.
   */
  test('the parts are in the server-rendered page, named by the plates’ headings, the first plate left out', () => {
    const page = (
      <Plater>
        <Plate tone="white" label="t">
          <Lines as="h1" id="t" text="Om oss" />
        </Plate>
        <Plate tone="navy" label="a">
          <Lines as="h2" id="a" text="Formål" />
        </Plate>
        <Plate tone="white" label="b c">
          <ul>
            <li>
              <span id="b">E-post</span> <a href="#">x</a>
            </li>
          </ul>
        </Plate>
      </Plater>
    );
    const html = renderToString(page);
    expect(html).toContain('href="#a"');
    expect(html).toContain('href="#b"');
    expect(html).not.toContain('href="#t"');
    expect(partsFrom(page.props.children)).toEqual([
      { id: 'a', label: 'Formål' },
      { id: 'b', label: 'E-post' },
    ]);
  });
});
