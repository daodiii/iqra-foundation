import { render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { Hero } from './Hero';

beforeEach(() => {
  document.body.innerHTML = '<a id="site-wordmark" data-on-dark="false"></a>';
  vi.mocked(HTMLMediaElement.prototype.play).mockClear();
});

test('the letters, the headline and the lede come from the content file', () => {
  render(<Hero />);
  expect(document.getElementById('hero-word')?.textContent).toBe('IQRA');
  const h1 = screen.getByRole('heading', { level: 1 });
  expect(h1.textContent).toBe('Iqra betyrles.');
  expect(screen.getByText(/første ordet i Koranen/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Still et spørsmål' })).toHaveAttribute('href', 'mailto:[EPOST]');
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
