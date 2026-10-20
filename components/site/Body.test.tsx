import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import sharp from 'sharp';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { Body } from './Body';

let root: string;
beforeEach(async () => {
  root = mkdtempSync(path.join(tmpdir(), 'iqra-body-'));
  mkdirSync(path.join(root, 'opplastet', 'nyheter', 'a'), { recursive: true });
  const png = await sharp({ create: { width: 30, height: 20, channels: 3, background: '#ffffff' } }).png().toBuffer();
  writeFileSync(path.join(root, 'opplastet', 'nyheter', 'a', 'b.png'), png);
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

test('the full text: headings, emphasis, a link, lists, a quote, a divider — and no second <article>, the page is the article', () => {
  const source = '## Overskrift\n\n### Under\n\nTekst med **fet**, _kursiv_ og [en lenke](https://example.org).\n\n- en\n- to\n\n1. første\n\n> Sitat\n\n---\n';
  const { container } = render(<Body source={source} root={root} />);
  expect(screen.getByRole('heading', { level: 2, name: 'Overskrift' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 3, name: 'Under' })).toBeInTheDocument();
  expect(container.querySelector('strong')).toHaveTextContent('fet');
  expect(container.querySelector('em')).toHaveTextContent('kursiv');
  expect(screen.getByRole('link', { name: 'en lenke' })).toHaveAttribute('href', 'https://example.org');
  expect(container.querySelectorAll('ul li')).toHaveLength(2);
  expect(container.querySelectorAll('ol li')).toHaveLength(1);
  expect(container.querySelector('blockquote')).toHaveTextContent('Sitat');
  expect(container.querySelector('hr')).not.toBeNull();
  expect(container.querySelector('article')).toBeNull();
});

test('HTML in the text is shown as text, never run', () => {
  const { container } = render(<Body source={'<script>alert(1)</script>'} root={root} />);
  expect(container.querySelector('script')).toBeNull();
  expect(container).toHaveTextContent('<script>alert(1)</script>');
});

test('a picture in the text keeps its words and its proportions, and is resized by Next', () => {
  render(<Body source={'![Et hvitt felt](/opplastet/nyheter/a/b.png)'} root={root} />);
  const img = screen.getByRole('img', { name: 'Et hvitt felt' });
  expect(img).toHaveAttribute('width', '30');
  expect(img).toHaveAttribute('height', '20');
  expect(img.getAttribute('src')).toMatch(/^\/_next\/image\?url=%2Fopplastet%2Fnyheter%2Fa%2Fb\.png/);
  // an <img>, not a <figure>: Markdoc puts a picture inside a paragraph, and a <figure> there is invalid HTML
  expect(img.closest('figure')).toBeNull();
});

test('a picture saved without its words is shown as decoration, with an empty alt — never refused, never dropped', () => {
  // What Keystatic writes when the editor never opened the picture's dialog (lib/fixtures/keystatic/nyheter/testnyhet/body.mdoc).
  // An empty alt gives the picture no accessible name, so it is found by its tag, not its role.
  const { container } = render(<Body source={'![](/opplastet/nyheter/a/b.png)'} root={root} />);
  const img = container.querySelector('img');
  expect(img).not.toBeNull();
  expect(img).toHaveAttribute('alt', '');
  expect(img).toHaveAttribute('width', '30');
  expect(img).toHaveAttribute('height', '20');
  expect(img!.getAttribute('src')).toMatch(/^\/_next\/image\?url=%2Fopplastet%2Fnyheter%2Fa%2Fb\.png/);
});

test('a picture whose file is not there is still shown, plain, with its words', () => {
  render(<Body source={'![Borte](/opplastet/nyheter/a/borte.png)'} root={root} />);
  expect(screen.getByRole('img', { name: 'Borte' })).toHaveAttribute('src', '/opplastet/nyheter/a/borte.png');
});
