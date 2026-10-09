import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { pageHref, TitleLink } from './TitleLink';

describe('TitleLink', () => {
  test('the title is the link, named by its words alone; the arrow is decoration and holds on to the last word', () => {
    render(<h2><TitleLink href="/om-oss">Om Iqra Foundation</TitleLink></h2>);
    const link = screen.getByRole('link', { name: 'Om Iqra Foundation' });
    expect(link).toHaveAttribute('href', '/om-oss');
    expect(screen.getByRole('heading', { level: 2, name: 'Om Iqra Foundation' })).toContainElement(link);
    expect(link).toHaveTextContent(/^Om Iqra Foundation$/);
    const arrow = link.querySelector('svg');
    expect(arrow).toHaveAttribute('aria-hidden', 'true');
    // the last word and the arrow are one unit, so the arrow never stands alone on a line
    expect(arrow?.parentElement).toHaveTextContent(/^Foundation$/);
  });

  test('a one-word title keeps its word with the arrow', () => {
    render(<TitleLink href="/arrangementer">Arrangementer</TitleLink>);
    const arrow = screen.getByRole('link', { name: 'Arrangementer' }).querySelector('svg');
    expect(arrow?.parentElement).toHaveTextContent(/^Arrangementer$/);
  });

  test('pageHref reads a page’s address from the menu, by its label', () => {
    for (const item of site.links) expect(pageHref(item.label)).toBe(item.href);
  });
});
