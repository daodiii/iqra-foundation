import { describe, expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { isPlaceholder } from './placeholder';

describe('isPlaceholder', () => {
  test('a bracketed token is a placeholder, anywhere in the string; a real value is not', () => {
    expect(isPlaceholder('[EPOST]')).toBe(true);
    expect(isPlaceholder('[GATEADRESSE]')).toBe(true);
    expect(isPlaceholder('Storgata 12')).toBe(false);
    expect(isPlaceholder('https://www.instagram.com/iqra')).toBe(false);
    expect(isPlaceholder('')).toBe(false);
  });

  test('the site’s unsupplied contact values read as placeholders and its place does not', () => {
    expect(isPlaceholder(site.contact.address.street)).toBe(true);
    expect(isPlaceholder(site.contact.phone)).toBe(true);
    for (const l of site.contact.follow) expect(isPlaceholder(l.href)).toBe(true);
    expect(isPlaceholder(site.place)).toBe(false);
  });
});
