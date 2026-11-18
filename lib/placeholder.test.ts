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

  test('the handles the client has not supplied read as placeholders, and the supplied facts do not', () => {
    for (const l of site.contact.follow) expect(isPlaceholder(l.href)).toBe(true);
    for (const v of [site.contact.email, site.contact.phone, site.contact.orgnr, ...site.contact.address]) expect(isPlaceholder(v)).toBe(false);
    expect(isPlaceholder(site.place)).toBe(false);
  });
});
