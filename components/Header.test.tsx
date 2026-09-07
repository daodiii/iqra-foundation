import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Header } from './Header';
import { setWordmarkOnDark } from '@/lib/wordmark';

test('the header is one link: the wordmark, named for screen readers', () => {
  render(<Header />);
  const link = screen.getByRole('link', { name: 'Iqra Foundation, til toppen' });
  expect(link).toHaveAttribute('id', 'site-wordmark');
  expect(link).toHaveAttribute('href', '/');
  expect(link).toHaveTextContent('IQRA');
  expect(screen.queryAllByRole('link')).toHaveLength(1);
});

test('setWordmarkOnDark flips the data attribute the stylesheet reads', () => {
  render(<Header />);
  setWordmarkOnDark(true);
  expect(document.getElementById('site-wordmark')).toHaveAttribute('data-on-dark', 'true');
  setWordmarkOnDark(false);
  expect(document.getElementById('site-wordmark')).toHaveAttribute('data-on-dark', 'false');
});
