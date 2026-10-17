import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { LOGO_ON_NAVY_CRIMSON } from '@/components/site/Logo';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { Hero } from './Hero';

const realMatchMedia = window.matchMedia;
afterEach(() => {
  window.matchMedia = realMatchMedia;
  document.getElementById('topp')?.remove();
});

const reduced = () => {
  window.matchMedia = ((q: string) => ({ ...realMatchMedia(q), matches: q.includes('prefers-reduced-motion') })) as typeof window.matchMedia;
};

/** The site's header, as far as the hero needs it: the two logos it lands on. */
const header = () => {
  const h = document.createElement('header');
  h.id = 'topp';
  for (const ground of ['white', 'navy']) {
    const img = document.createElement('img');
    img.setAttribute('data-logo', ground);
    img.alt = '';
    h.append(img);
  }
  document.body.prepend(h);
};

describe('Hero', () => {
  test('the logo is the heading: the one h1 holds the reversed logo with the crimson accents, named for the logo, and the brief’s headline is not on the page; the paragraph is the brief’s; the two buttons go where the brief says', () => {
    render(<Hero />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveAccessibleName(site.logoAlt);
    expect(h1.querySelector('img')).toHaveAttribute('src', LOGO_ON_NAVY_CRIMSON);
    expect(screen.queryByText(brief.home.headline)).toBeNull();
    expect(screen.getByText(brief.home.paragraph)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: site.cta.work.label })).toHaveAttribute('href', '/vart-arbeid');
    expect(screen.getByRole('link', { name: site.cta.support.label })).toHaveAttribute('href', '/stott-oss');
  });

  test('a navy plate under the header, named by the part of the heading that moves: the header turns navy over it and watches #hovedtekst to know when the name has landed on its logo', () => {
    const { container } = render(<Hero />);
    const section = container.querySelector('section')!;
    expect(section).toHaveAttribute('data-header', 'dark');
    expect(section).toHaveAttribute('aria-labelledby', 'hovedtekst');
    const moving = document.getElementById('hovedtekst')!;
    expect(moving.closest('h1')).toBe(screen.getByRole('heading', { level: 1 }));
    expect(moving.querySelector('img')).toHaveAttribute('alt', site.logoAlt);
  });

  test('the picture is a decorative ground, in two widths, and there is no film and nothing drawn every frame', () => {
    const { container } = render(<Hero />);
    const picture = container.querySelector('img[data-picture]')!;
    expect(picture).toHaveAttribute('alt', '');
    expect(picture.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(picture.getAttribute('srcset')).toContain('/hero/staden-960.webp 960w');
    expect(picture.getAttribute('srcset')).toContain('/hero/staden-1920.webp 1920w');
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('canvas')).toBeNull();
  });

  test('with the header there, the name is set to step out of the header’s logo and the greeting starts on the next frame', async () => {
    header();
    const { container } = render(<Hero />);
    const greet = document.getElementById('hovedtekst')!.firstElementChild as HTMLElement;
    for (const v of ['--gx', '--gy', '--gs']) expect(greet.style.getPropertyValue(v)).not.toBe('');
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    expect(container.querySelector('section')).toHaveAttribute('data-in', '');
  });

  test('under reduced motion nothing moves: no greeting, the name stands in the hero (the stylesheet shows it), and the copy is there', async () => {
    reduced();
    header();
    const { container } = render(<Hero />);
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    expect(container.querySelector('section')).not.toHaveAttribute('data-in');
    expect((document.getElementById('hovedtekst')!.firstElementChild as HTMLElement).style.getPropertyValue('--gx')).toBe('');
    expect(screen.getByText(brief.home.paragraph)).toBeInTheDocument();
  });
});
