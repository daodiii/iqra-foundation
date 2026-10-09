import { render, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { Contact } from './Contact';

const realMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = realMatchMedia; });

const t = site.pages.home.contact;

describe('Contact, the ending', () => {
  test('the question word by word, and the sheet with the line and the two actions, Kontakt and Støtt oss, on one deep navy plate in a scene', () => {
    const { container } = render(<Contact />);
    const section = container.querySelector('section#kontakt') as HTMLElement;
    const title = within(section).getByRole('heading', { level: 2 });
    expect(section).toHaveAttribute('aria-labelledby', title.id);
    expect(title).toHaveTextContent(t.question);
    expect(title.querySelectorAll('[data-word]')).toHaveLength(t.question.split(' ').length);
    const sheet = section.querySelector('[data-sheet]') as HTMLElement;
    expect(within(sheet).getByText(t.line)).toBeInTheDocument();
    const links = within(sheet).getAllByRole('link');
    expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      [site.cta.contact.label, '/kontakt'],
      [site.cta.support.label, '/stott-oss'],
    ]);
    const scene = container.querySelector('[data-scene]') as HTMLElement;
    expect(scene).toHaveAttribute('data-header', 'dark');
    const plates = container.querySelectorAll('[data-material="flat"]');
    expect(plates).toHaveLength(1);
    expect(plates[0]).toHaveAttribute('data-ground', 'navy-deep');
  });
});
