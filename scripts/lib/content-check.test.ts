import { describe, expect, test } from 'vitest';
import { contentProblems } from './content-check.mjs';
import { site } from '@/content/site.no';

describe('contentProblems', () => {
  test('the real content has no problems outside production', () => {
    expect(contentProblems(site, { production: false })).toEqual([]);
  });

  test('flags empty strings anywhere, with their path', () => {
    const broken = { ...site, hero: { ...site.hero, lede: '   ' } };
    expect(contentProblems(broken, { production: false })).toEqual(['hero.lede is empty']);
  });

  test('flags the email placeholder only in production', () => {
    expect(contentProblems(site, { production: true })).toEqual([
      'contact.email is still the [EPOST] placeholder',
    ]);
  });
});
