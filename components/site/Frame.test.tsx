import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Frame } from './Frame';

test('a post’s picture in its 3:2 frame, filled and resized by Next, with its words', () => {
  render(<Frame picture={{ src: '/opplastet/nyheter/a/src.jpg', alt: 'Et rom' }} sizes="640px" className="x" />);
  const img = screen.getByRole('img', { name: 'Et rom' });
  expect(img.getAttribute('src')).toMatch(/^\/_next\/image\?url=%2Fopplastet%2Fnyheter%2Fa%2Fsrc\.jpg/);
  expect(img).toHaveAttribute('sizes', '640px');
  const frame = img.parentElement!;
  expect(frame).toHaveAttribute('data-frame');
  expect(frame).toHaveClass('x');
});
