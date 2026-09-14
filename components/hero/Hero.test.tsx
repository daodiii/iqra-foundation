import { render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { site } from '@/content/site.no';
import { Hero } from './Hero';

beforeEach(() => {
  document.body.innerHTML = '<a id="site-wordmark" data-on-dark="false"></a>';
  vi.mocked(HTMLMediaElement.prototype.play).mockClear();
});

/**
 * After the scroll the hero says the name — «IQRA FOUNDATION», 2026-09-14 — over the
 * paragraph the user wrote, and the one button under them goes on to Visjon; the mailto
 * moved out of the hero (Misjon and /om-oss keep it). The name gets no crimson full stop.
 */
test('the letters, the name and the lede come from the content file, and the button goes on to Visjon', () => {
  render(<Hero />);
  const lines = [...document.querySelectorAll('#hero-lockup text')].map((t) => t.textContent);
  expect(lines).toEqual(['IQRA', 'FOUNDATION']);
  // The name in caps, on one line («make the title IQRA FOUNDATION in caps … so that it
  // fits on one line», 2026-09-14); no crimson full stop.
  const h1 = screen.getByRole('heading', { level: 1 });
  expect(h1.textContent).toBe('IQRA FOUNDATION');
  expect(h1.querySelectorAll('[class*="line"]')).toHaveLength(1);
  expect(h1.querySelector('[class*="dot"]')).toBeNull();
  expect(screen.getByText(site.hero.lede)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: site.next.visjon })).toHaveAttribute('href', '#visjon');
  expect(document.querySelector('#hero a[href^="mailto:"]')).toBeNull();
});

test('the video is decorative, looped, muted, and gets the webm loop at desktop width', () => {
  render(<Hero />);
  const video = document.querySelector('#hero video') as HTMLVideoElement;
  expect(video).toHaveAttribute('aria-hidden', 'true');
  expect(video).toHaveAttribute('loop');
  expect(video).toHaveAttribute('poster', '/media/iqra-poster.jpg');
  expect(video.src).toMatch(/\/media\/iqra-loop-1080\.webm$/);
  expect(video.muted).toBe(true);
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
});

test('the mask covers far beyond the viewbox so the overlay never shows an edge', () => {
  render(<Hero />);
  const rects = document.querySelectorAll('#hero svg rect');
  expect(rects).toHaveLength(2);
  rects.forEach((r) => {
    expect(Number(r.getAttribute('width'))).toBeGreaterThan(20000);
    expect(Number(r.getAttribute('x'))).toBeLessThan(-10000);
  });
});
