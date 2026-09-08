import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { Footer } from './Footer';

test('footer shows the year, the name and the email', () => {
  render(<Footer />);
  expect(screen.getByText(new RegExp(`${new Date().getFullYear()} Iqra Foundation`))).toBeInTheDocument();
  expect(screen.getByRole('link', { name: site.contact.email }))
    .toHaveAttribute('href', `mailto:${site.contact.email}`);
});
