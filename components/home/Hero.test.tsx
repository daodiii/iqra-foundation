import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { Hero } from './Hero';

const realMatchMedia = window.matchMedia;
beforeEach(() => vi.clearAllMocks());
afterEach(() => { window.matchMedia = realMatchMedia; });

describe('Hero', () => {
  test('the headline is the brief’s and the one h1; the paragraph is the brief’s; the two buttons go where the brief says', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(brief.home.headline);
    expect(screen.getByText(brief.home.paragraph)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: site.cta.work.label })).toHaveAttribute('href', '/vart-arbeid');
    expect(screen.getByRole('link', { name: site.cta.support.label })).toHaveAttribute('href', '/stott-oss');
  });

  test('the film plays inside the four letters: they are the mask, the two accents stay solid, and the mark is the logo to a screen reader', () => {
    const { container } = render(<Hero />);
    const mask = container.querySelector('mask')!;
    expect(mask.querySelectorAll('path')).toHaveLength(4);
    expect(container.querySelectorAll('[data-accent]')).toHaveLength(2);
    expect(container.querySelector('rect[mask]')).toHaveAttribute('mask', 'url(#mark-letters)');
    expect(screen.getByRole('img', { name: site.logoAlt })).toBeInTheDocument();
  });

  test('the film takes the band first: a second video over everything, the same source, playing; the letters’ film is loaded and waits', () => {
    const { container } = render(<Hero />);
    const [inLetters, over] = Array.from(container.querySelectorAll('video'));
    expect(container.firstElementChild).toHaveAttribute('data-film', 'over');
    expect(over).toHaveAttribute('data-over');
    for (const v of [inLetters, over]) {
      expect(v).toHaveAttribute('poster', '/media/iqra-poster.jpg');
      expect(v).toHaveAttribute('loop');
      expect(v).toHaveAttribute('playsinline');
      expect(v.muted).toBe(true);
      // The stub says WebM plays and the viewport is not narrow: the 1080p WebM.
      expect(v.getAttribute('src')).toBe('/media/iqra-loop-1080.webm');
    }
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    expect(vi.mocked(HTMLMediaElement.prototype.play).mock.instances[0]).toBe(over);
  });

  test('when the film has run once it hands over: the letters’ film starts as the take-over fades, and after the fade the take-over is gone', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<Hero />);
      const [inLetters, over] = Array.from(container.querySelectorAll('video'));
      const at = (t: number) => {
        Object.defineProperty(over, 'currentTime', { value: t, configurable: true });
        fireEvent(over, new Event('timeupdate'));
      };
      at(2.5);
      at(4.9);
      expect(container.firstElementChild).toHaveAttribute('data-film', 'over');
      // The loop wraps: the same frames start again, now in the letters as well.
      act(() => at(0.1));
      expect(container.firstElementChild).toHaveAttribute('data-film', 'inside');
      expect(vi.mocked(HTMLMediaElement.prototype.play).mock.instances.at(-1)).toBe(inLetters);
      expect(container.querySelector('[data-over]')).toBe(over);
      act(() => { vi.advanceTimersByTime(1000); });
      expect(container.querySelector('[data-over]')).toBeNull();
      expect(container.firstElementChild).toHaveAttribute('data-film', 'done');
    } finally {
      vi.useRealTimers();
    }
  });

  test('autoplay refused: no take-over, and the poster stands in the letters', async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new DOMException('NotAllowedError'));
    const { container } = render(<Hero />);
    await act(async () => {});
    expect(container.querySelector('[data-over]')).toBeNull();
    expect(container.querySelectorAll('video')).toHaveLength(1);
    expect(container.querySelector('video')).toHaveAttribute('poster', '/media/iqra-poster.jpg');
  });

  test('a phone gets the 720p loop', () => {
    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('max-width') })) as typeof window.matchMedia;
    const { container } = render(<Hero />);
    for (const v of Array.from(container.querySelectorAll('video'))) expect(v.getAttribute('src')).toBe('/media/iqra-loop-720.webm');
  });

  test('under reduced motion neither video gets a source (the stylesheet keeps the take-over off), the poster stands in the letters and nothing plays', () => {
    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
    const { container } = render(<Hero />);
    const videos = Array.from(container.querySelectorAll('video'));
    expect(videos).toHaveLength(2);
    for (const v of videos) {
      expect(v.getAttribute('src')).toBeNull();
      expect(v).toHaveAttribute('poster', '/media/iqra-poster.jpg');
    }
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
});
