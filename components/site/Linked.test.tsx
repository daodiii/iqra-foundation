import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { expect, test, vi } from 'vitest';
import { Linked } from './Linked';

/*
 * In jsdom a next/link and a plain <a> render the same element and neither prevents a click
 * (there is no router), so next/link is stood in for by an anchor that says it went through it.
 */
vi.mock('next/link', () => ({
  default: ({ href, prefetch, children }: { href: string; prefetch?: boolean; children: ReactNode }) => (
    <a href={href} data-next-link={prefetch === false ? 'no-prefetch' : 'prefetch'}>
      {children}
    </a>
  ),
}));

test('a title linked to a page here, to an address elsewhere, or not at all', () => {
  render(
    <ul>
      <li><Linked href="/nyheter/a">A</Linked></li>
      <li><Linked href="https://example.org">B</Linked></li>
      <li><Linked href={null}>C</Linked></li>
    </ul>,
  );
  expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('href', '/nyheter/a');
  expect(screen.getByRole('link', { name: 'A' }), 'a page here goes through next/link, unprefetched').toHaveAttribute('data-next-link', 'no-prefetch');
  expect(screen.getByRole('link', { name: 'B' })).toHaveAttribute('href', 'https://example.org');
  expect(screen.getByRole('link', { name: 'B' })).not.toHaveAttribute('data-next-link');
  expect(screen.queryByRole('link', { name: 'C' })).toBeNull();
  expect(screen.getByText('C')).toBeInTheDocument();
});

test('a file here and an address on another host are plain links, not next/link', () => {
  const files = ['/files/ressurser/r.pdf', '/opplastet/nyheter/a/bilde', '/media/menneskene/a', '/rapport.pdf', '/arsrapport.PDF?v=2', '//example.org/side'];
  render(
    <ul>
      {files.map((href) => (
        <li key={href}><Linked href={href}>{href}</Linked></li>
      ))}
    </ul>,
  );
  for (const href of files) {
    const link = screen.getByRole('link', { name: href });
    expect(link).toHaveAttribute('href', href);
    expect(link, href).not.toHaveAttribute('data-next-link');
  }
});
