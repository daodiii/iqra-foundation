import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Vision } from './Vision';

test('one line per vision line, and the four names of the tree', () => {
  render(<Vision />);
  expect(document.querySelectorAll('[data-line]')).toHaveLength(4);
  expect(screen.getByText('Vi vil ha et Norge')).toBeInTheDocument();
  expect(screen.getByText('Der det er lett å spørre, og lett å få et ærlig svar.')).toBeInTheDocument();
  const limbs = [...document.querySelectorAll('[data-limb]')].map((el) => el.textContent);
  expect(limbs).toEqual(['Dialog', 'Brobygging', 'Kunnskap']);
  expect(document.querySelector('[data-root]')?.textContent).toBe('Iqra');
  expect(screen.getByRole('figure', { name: /roten er Iqra/ })).toBeInTheDocument();
  expect(document.getElementById('visjon')).toHaveAttribute('aria-labelledby', 'visjon-label');
});
