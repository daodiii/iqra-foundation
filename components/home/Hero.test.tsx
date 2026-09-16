import { render, screen } from '@testing-library/react';
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

  test('the video carries the poster, is muted, loops and plays inline; its source is picked after mount', () => {
    const { container } = render(<Hero />);
    const video = container.querySelector('video')!;
    expect(video).toHaveAttribute('poster', '/media/iqra-poster.jpg');
    expect(video).toHaveAttribute('loop');
    expect(video).toHaveAttribute('playsinline');
    expect(video.muted).toBe(true);
    // The stub says WebM plays and the viewport is not narrow: the 1080p WebM.
    expect(video.getAttribute('src')).toBe('/media/iqra-loop-1080.webm');
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  test('a phone gets the 720p loop', () => {
    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('max-width') })) as typeof window.matchMedia;
    const { container } = render(<Hero />);
    expect(container.querySelector('video')!.getAttribute('src')).toBe('/media/iqra-loop-720.webm');
  });

  test('under reduced motion the poster stands in the letters and nothing plays', () => {
    window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
    const { container } = render(<Hero />);
    const video = container.querySelector('video')!;
    expect(video.getAttribute('src')).toBeNull();
    expect(video).toHaveAttribute('poster', '/media/iqra-poster.jpg');
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
});
