import { describe, expect, test } from 'vitest';
import { contentPlaceholders, contentProblems, paymentPlaceholders } from './content-check.mjs';
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
   * The email is not a special case any more: the roster, the figures and the account
   * number are exactly as embarrassing to ship. Every placeholder in the content has to
   * be reported, not a remembered list of the ones we happened to think of.
   *
   * Both sides are derived from the content rather than named here. Naming a token makes
   * the test fail on the day someone supplies the real value — which is the one day it
   * ought to stay quiet — and that is precisely how it broke when the email arrived.
   */
  test('flags every placeholder, and only in production', () => {
    const found = contentPlaceholders(site);
    expect(found.length, 'nothing left to flag, so this test proves nothing').toBeGreaterThan(0);

    const problems = contentProblems(site, { production: true });
    expect(problems).toHaveLength(found.length);
    for (const { path, token } of found) {
      expect(problems).toContain(`${path} is still the ${token} placeholder`);
    }
    expect(contentProblems(site, { production: false })).toEqual([]);
  });

  /**
   * The escape hatch that puts the unfinished site on a public URL. It has to skip the
   * placeholders and nothing else: an empty string is a bug in any environment, and a
   * hatch that swallowed those too would turn a deliberate «ship it unfinished» into a
   * blanket «stop checking».
   */
  test('allowPlaceholders opens the gate in production, but only for placeholders', () => {
    expect(contentProblems(site, { production: true, allowPlaceholders: true })).toEqual([]);

    const broken = { ...site, hero: { ...site.hero, lede: '  ' } };
    expect(contentProblems(broken, { production: true, allowPlaceholders: true }))
      .toEqual(['hero.lede is empty']);
  });

  test('the gate still refuses by default, so the hatch has to be asked for', () => {
    expect(contentProblems(site, { production: true }).length).toBeGreaterThan(0);
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

describe('paymentPlaceholders', () => {
  /**
   * These four are the reason the loud warning exists. They are the numbers a visitor
   * would try to send money to, so if the set ever drifts — a field renamed, a fifth one
   * added — the build log would go quiet about exactly the thing it is there to shout.
   */
  test('finds the payment details, and nothing that is merely unfinished', () => {
    const paths = paymentPlaceholders(site).map((p) => p.path);
    expect(paths).toEqual(['support.account', 'support.kid', 'support.vippsNumber', 'support.orgnr']);
    expect(paths.some((p) => p.startsWith('about.'))).toBe(false);
  });

  test('it is a subset of every placeholder, not a separate list that can drift', () => {
    const all = contentPlaceholders(site).map((p) => p.path);
    for (const { path } of paymentPlaceholders(site)) expect(all).toContain(path);
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
