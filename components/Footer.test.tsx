import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Footer } from './Footer';

test('footer shows the year, the name and the email', () => {
  render(<Footer />);
  expect(screen.getByText(new RegExp(`${new Date().getFullYear()} Iqra Foundation`))).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '[EPOST]' })).toHaveAttribute('href', 'mailto:[EPOST]');
});
