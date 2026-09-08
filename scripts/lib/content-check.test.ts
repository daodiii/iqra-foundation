import { describe, expect, test } from 'vitest';
import { contentPlaceholders, contentProblems } from './content-check.mjs';
import { site } from '@/content/site.no';

describe('contentProblems', () => {
  test('the real content has no problems outside production', () => {
    expect(contentProblems(site, { production: false })).toEqual([]);
  });

  test('flags empty strings anywhere, with their path', () => {
    const broken = { ...site, hero: { ...site.hero, lede: '   ' } };
    expect(contentProblems(broken, { production: false })).toEqual(['hero.lede is empty']);
  });

  /**
   * The email is not a special case any more: the roster and the figures are exactly as
   * embarrassing to ship. Every placeholder in the content has to be reported, not a
   * remembered list of the ones we happened to think of.
   */
  test('flags every placeholder, and only in production', () => {
    const problems = contentProblems(site, { production: true });
    expect(problems).toHaveLength(contentPlaceholders(site).length);
    expect(problems).toContain('contact.email is still the [EPOST] placeholder');
    expect(problems.some((p) => p.includes('[Navn]'))).toBe(true);
    expect(problems.some((p) => p.includes('[N]'))).toBe(true);
  });

  test('content with nothing left to fill in passes a production build', () => {
    const done = {
      hero: { lede: 'Ferdig tekst.' },
      team: [{ name: 'Aisha', role: 'Leder' }],
      contact: { email: 'hei@example.no' },
    };
    expect(contentProblems(done, { production: true })).toEqual([]);
  });
});

describe('contentPlaceholders', () => {
  test('reports the path and the token, through arrays and nesting', () => {
    const found = contentPlaceholders({
      contact: { email: '[EPOST]' },
      team: [{ name: '[Navn]' }, { name: 'Yusuf' }],
    });
    expect(found).toEqual([
      { path: 'contact.email', token: '[EPOST]' },
      { path: 'team[0].name', token: '[Navn]' },
    ]);
  });

  test('the whole roster and both figures are found in the real content', () => {
    const paths = contentPlaceholders(site).map((p) => p.path);
    const team = site.about.chapters.find((c) => 'team' in c)!.team!;
    team.forEach((_, i) => {
      expect(paths).toContain(`about.chapters[1].team[${i}].name`);
    });
    const figures = site.about.chapters.find((c) => 'figures' in c)!.figures!;
    figures.forEach((_, i) => {
      expect(paths).toContain(`about.chapters[2].figures[${i}].value`);
    });
  });
});
