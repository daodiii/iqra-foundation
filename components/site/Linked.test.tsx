import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Linked } from './Linked';

test('a title linked to a page here, to an address elsewhere, or not at all', () => {
  render(
    <ul>
      <li><Linked href="/nyheter/a">A</Linked></li>
      <li><Linked href="https://example.org">B</Linked></li>
      <li><Linked href={null}>C</Linked></li>
    </ul>,
  );
  expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('href', '/nyheter/a');
  expect(screen.getByRole('link', { name: 'B' })).toHaveAttribute('href', 'https://example.org');
  expect(screen.queryByRole('link', { name: 'C' })).toBeNull();
  expect(screen.getByText('C')).toBeInTheDocument();
});
