import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { LOGO_ON_NAVY_CRIMSON } from '@/components/site/Logo';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { Hero } from './Hero';

const realMatchMedia = window.matchMedia;
afterEach(() => {
  window.matchMedia = realMatchMedia;
  document.getElementById('topp')?.remove();
  vi.restoreAllMocks();
});

const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON() {} }) as DOMRect;

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
    // a phone takes its own crop, the middle at full height, not the 1920 file its 3× screen would pick by width
    const phone = container.querySelector('picture source')!;
    expect(phone).toHaveAttribute('media', '(max-width: 767px)');
    expect(phone).toHaveAttribute('srcset', '/hero/staden-phone.webp');
  });

  test('the greeting sets off from the header’s logo measured against the header, so a header still sliding back in (`data-away`) does not put it above the screen', () => {
    header();
    // the header 73px up, mid-slide; its logo 16px down inside it; the name in the hero at 200, 300, 900 wide
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.id === 'topp') return rect(0, -73, 1536, 72);
      if (this.hasAttribute('data-logo')) return this.getAttribute('data-logo') === 'navy' ? rect(96, -57, 72.9, 40) : rect(0, 0, 0, 0);
      if (this.parentElement?.id === 'hovedtekst') return rect(200, 300, 900, 494);
      return rect(0, 0, 0, 0);
    });
    render(<Hero />);
    const greet = document.getElementById('hovedtekst')!.firstElementChild as HTMLElement;
    expect(greet.style.getPropertyValue('--gx')).toBe('-104.00px');
    // 16 - 300, where the screen's -57 would have said -357
    expect(greet.style.getPropertyValue('--gy')).toBe('-284.00px');
  });

  test('a name the stylesheet has already shown in place (a phone slower than its 1.5 s) is not sent back into the header to greet again', () => {
    header();
    const real = window.getComputedStyle;
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: string | null) => {
      const style = real(el, pseudo);
      if (el.parentElement?.id !== 'hovedtekst') return style;
      // what the stylesheet's `appear` leaves on it at 1.5 s
      return new Proxy(style, {
        get: (t, p) => (p === 'getPropertyValue' ? (name: string) => (name === '--shown' ? '1' : t.getPropertyValue(name)) : Reflect.get(t, p)),
      });
    });
    render(<Hero />);
    const greet = document.getElementById('hovedtekst')!.firstElementChild as HTMLElement;
    for (const v of ['--gx', '--gy', '--gs']) expect(greet.style.getPropertyValue(v)).toBe('');
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
