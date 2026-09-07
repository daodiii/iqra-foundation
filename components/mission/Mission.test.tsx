import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Mission } from './Mission';

test('label, mission text and the call to action come from the content file', () => {
  render(<Mission />);
  expect(document.getElementById('misjon')).toHaveAttribute('aria-labelledby', 'misjon-label');
  expect(screen.getByText('Misjon')).toHaveAttribute('id', 'misjon-label');
  expect(screen.getByText(/bygger vi broer/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Still et spørsmål' })).toHaveAttribute('href', 'mailto:[EPOST]');
});

test('the still has an avif source, a webp source and an empty alt', () => {
  render(<Mission />);
  expect(document.querySelector('#misjon source[type="image/avif"]')).toHaveAttribute('srcset', '/media/still-koran.avif');
  expect(document.querySelector('#misjon source[type="image/webp"]')).toHaveAttribute('srcset', '/media/still-koran.webp');
  expect(document.querySelector('#misjon img')).toHaveAttribute('alt', '');
});
