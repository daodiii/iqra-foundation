import { expect, test, vi } from 'vitest';
import { contentPlaceholders } from '@/scripts/lib/content-check.mjs';
import { site } from '@/content/site.no';

// next/font is compiled by Next, not by vite, so calling the loader here throws. Nothing
// in this file looks at the fonts; it only needs the module to import.
vi.mock('next/font/google', () => {
  const font = () => ({ variable: '', className: '', style: { fontFamily: '' } });
  return { Geist: font };
});

// The noindex is not a preference, it is tied to the filler: as long as the content still
// has bracketed placeholders the site must stay out of search. When the last one is filled
// in this test fails, which is the reminder to delete the `robots` field rather than leave
// the finished site quietly unindexed.
test('the site is noindex for as long as the content has placeholders', async () => {
  const { metadata } = await import('./layout');
  const left = contentPlaceholders(site);
  if (left.length) {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  } else {
    expect(metadata.robots).toBeUndefined();
  }
});
