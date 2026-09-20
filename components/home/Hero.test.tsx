import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { CAST_W } from './cast';
import { Hero } from './Hero';

const realMatchMedia = window.matchMedia;
beforeEach(() => vi.clearAllMocks());
afterEach(() => { window.matchMedia = realMatchMedia; });

const reduced = () => {
  window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
};

describe('Hero', () => {
  test('the lockup is the heading: the one h1 is the mark with FOUNDATION, named for the logo, and the brief’s headline is not on the page; the paragraph is the brief’s; the two buttons go where the brief says', () => {
    const { container } = render(<Hero />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveAccessibleName(site.logoAlt);
    expect(h1.querySelector('svg')).toBe(container.querySelector('svg'));
    expect(screen.queryByText(brief.home.headline)).toBeNull();
    expect(screen.getByText(brief.home.paragraph)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: site.cta.work.label })).toHaveAttribute('href', '/vart-arbeid');
    expect(screen.getByRole('link', { name: site.cta.support.label })).toHaveAttribute('href', '/stott-oss');
  });

  test('the film is in the letters from the first frame: the one video is clipped to the lockup’s fourteen letters (the name’s four, FOUNDATION’s ten), and the two accents stay solid', () => {
    const { container } = render(<Hero />);
    const video = container.querySelector('video')!;
    expect(container.querySelectorAll('video')).toHaveLength(1);
    expect(video.style.clipPath).toBe('url("#hero-letters")');
    expect(container.querySelector('clipPath#hero-letters')!.querySelectorAll('path')).toHaveLength(14);
    expect(container.querySelectorAll('[data-accent]')).toHaveLength(2);
  });

  test('every letter has a piece of the paper clipped to it and a blade round it; the blades write the name in reading order — i, Q, R, a — though the art lists a, i, Q, R, and then the word', () => {
    const { container } = render(<Hero />);
    const pieces = Array.from(container.querySelectorAll<HTMLElement>('[data-piece]'));
    const blades = Array.from(container.querySelectorAll<SVGPathElement>('[data-blade]'));
    expect(pieces).toHaveLength(14);
    expect(blades).toHaveLength(14);
    pieces.forEach((p, k) => {
      expect(p.style.clipPath).toBe(`url("#hero-cut-${k}")`);
      expect(container.querySelector(`clipPath#hero-cut-${k}`)!.querySelectorAll('path')).toHaveLength(1);
    });
    const order = (els: HTMLElement[] | SVGPathElement[]) => els.map((el) => Number(el.style.getPropertyValue('--i')));
    expect(order(blades)).toEqual([3, 0, 1, 2, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(order(pieces)).toEqual(order(blades));
    for (const b of blades) expect(b).toHaveAttribute('pathLength', '1');
    // The word's ten are drawn with the small blade, the name's four with the large.
    expect(blades.filter((b) => b.hasAttribute('data-small'))).toHaveLength(10);
    expect(pieces.filter((p) => p.hasAttribute('data-small'))).toHaveLength(10);
  });

  test('the film is loaded and played at mount, its source picked for the screen: the 1080p WebM here', () => {
    const { container } = render(<Hero />);
    const video = container.querySelector('video')!;
    expect(video).toHaveAttribute('poster', '/media/iqra-poster.jpg');
    expect(video).toHaveAttribute('loop');
    expect(video).toHaveAttribute('playsinline');
    expect(video.muted).toBe(true);
    expect(video.getAttribute('src')).toBe('/media/iqra-loop-1080.webm');
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    expect(vi.mocked(HTMLMediaElement.prototype.play).mock.instances[0]).toBe(video);
  });

  test('a phone gets the 720p loop', () => {
    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('max-width') })) as typeof window.matchMedia;
    const { container } = render(<Hero />);
    expect(container.querySelector('video')!.getAttribute('src')).toBe('/media/iqra-loop-720.webm');
  });

  test('the cast: a canvas under the lockup, made at mount to take the film’s light', () => {
    const { container } = render(<Hero />);
    const cast = container.querySelector<HTMLCanvasElement>('canvas[data-cast]')!;
    expect(cast).toHaveAttribute('aria-hidden', 'true');
    expect(cast.width).toBe(CAST_W);
  });

  test('autoplay refused: nothing is thrown, and the poster stands in the letters', async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new DOMException('NotAllowedError'));
    const { container } = render(<Hero />);
    await act(async () => {});
    expect(container.querySelector('video')).toHaveAttribute('poster', '/media/iqra-poster.jpg');
  });

  test('under reduced motion the video gets no source, nothing plays and no cast is made: the poster stands in the open letters (the stylesheet opens them) and the copy is printed', () => {
    reduced();
    const { container } = render(<Hero />);
    const video = container.querySelector('video')!;
    expect(video.getAttribute('src')).toBeNull();
    expect(video).toHaveAttribute('poster', '/media/iqra-poster.jpg');
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(container.querySelector<HTMLCanvasElement>('canvas[data-cast]')!.width).not.toBe(CAST_W);
    expect(screen.getByText(brief.home.paragraph)).toBeInTheDocument();
  });
});
