import { describe, expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { numbers } from './gaver';

describe('the numbers under «Gave»', () => {
  test('a bracketed account number does not stand; the Vipps number does', () => {
    const shown = numbers({ account: { label: 'Kontonummer', value: '[KONTO]' }, vipps: site.support.vipps });
    expect(shown.map((n) => n.value)).toEqual([site.support.vipps.value]);
  });

  test('once the client gives a real account number it stands first, before Vipps, with its label', () => {
    const shown = numbers({ account: { label: 'Kontonummer', value: '1234 56 78903' }, vipps: site.support.vipps });
    expect(shown).toEqual([
      { key: 'konto', label: 'Kontonummer', value: '1234 56 78903' },
      { key: 'vipps', label: site.support.vipps.label, value: site.support.vipps.value },
    ]);
  });

  test('the site’s own Vipps number is there today', () => {
    expect(numbers().some((n) => n.value === '26354')).toBe(true);
  });
});
