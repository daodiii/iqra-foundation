import { render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { headerElements, setWordmarkOnDark } from '@/lib/wordmark';
import { Header } from './Header';

test('the wordmark goes home and is named for screen readers', () => {
  render(<Header />);
  const link = screen.getByRole('link', { name: site.header.homeLabel });
  expect(link).toHaveAttribute('id', 'site-wordmark');
  expect(link).toHaveAttribute('href', '/');
  expect(link).toHaveTextContent(site.header.wordmark);
});

test('the nav is one link, to Om oss, inside a named landmark', () => {
  render(<Header />);
  const nav = screen.getByRole('navigation', { name: site.header.navLabel });
  expect(nav).toHaveAttribute('id', 'site-nav');
  const link = within(nav).getByRole('link', { name: site.about.label });
  expect(link).toHaveAttribute('href', '/om-oss');
  expect(within(nav).getAllByRole('link')).toHaveLength(1);
});

test('setWordmarkOnDark flips the data attribute the stylesheet reads', () => {
  render(<Header />);
  setWordmarkOnDark(true);
  expect(document.getElementById('site-wordmark')).toHaveAttribute('data-on-dark', 'true');
  setWordmarkOnDark(false);
  expect(document.getElementById('site-wordmark')).toHaveAttribute('data-on-dark', 'false');
});

/**
 * The nav takes its colour from the wordmark's attribute through a sibling selector, so
 * the nav has to come after the wordmark in the DOM. Reorder them and the header goes
 * white-on-white over the film with nothing failing anywhere else.
 */
test('the nav follows the wordmark in the DOM, which is what the sibling selector needs', () => {
  render(<Header />);
  const wordmark = document.getElementById('site-wordmark')!;
  const nav = document.getElementById('site-nav')!;
  expect(wordmark.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

/** Only the hero hides the header, and it needs both pieces to fade them together. */
test('headerElements finds the wordmark and the nav', () => {
  render(<Header />);
  expect(headerElements().map((el) => el.id)).toEqual(['site-wordmark', 'site-nav']);
});
