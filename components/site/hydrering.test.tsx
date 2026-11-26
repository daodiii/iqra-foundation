import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JsMark } from './JsMark';
import { pagePath } from './PageJsonLd';
import { pageTable } from '@/lib/page-schema';

// 2026-11-26: Vercel's hourly regeneration of the front page renders under /index. PageJsonLd found no
// row there, rendered nothing on the server and a script in the browser; React rebuilt the page and
// <html> lost data-js, so the front page fell back to its no-JavaScript layout.
describe('the front page survives its hourly regeneration', () => {
  it('reads /index as the home page in both languages', () => {
    expect(pagePath('/index')).toBe('/');
    expect(pagePath('/en/index')).toBe('/en');
    expect(pageTable('no')[pagePath('/index')]).toBeDefined();
    expect(pageTable('en')[pagePath('/en/index')]).toBeDefined();
  });

  it('leaves other addresses as they were', () => {
    expect(pagePath('/')).toBe('/');
    expect(pagePath('/om-oss/')).toBe('/om-oss');
    expect(pagePath('/en')).toBe('/en');
    expect(pagePath(null)).toBe('');
  });

  it('puts data-js back on <html> when a client rebuild has wiped it', () => {
    delete document.documentElement.dataset.js;
    render(<JsMark />);
    expect(document.documentElement.hasAttribute('data-js')).toBe(true);
  });
});
