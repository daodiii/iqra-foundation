import { describe, expect, test } from 'vitest';
import { contentPlaceholders, contentProblems, paymentPlaceholders } from './content-check.mjs';
import { site } from '@/content/site.no';
import { site as siteEn } from '@/content/site.en';

/**
 * The real content has no placeholders left (2026-11-25), so the gate's tests run on a copy with
 * three put back: the shape the site had before, an account number and two social links.
 */
const unfinished = {
  ...site,
  contact: { ...site.contact, follow: [{ name: 'Instagram', href: '[INSTAGRAM]' }, { name: 'Facebook', href: '[FACEBOOK]' }] },
  support: { ...site.support, account: { ...site.support.account, value: '[KONTO]' } },
};

describe('contentProblems', () => {
  test('the real content has no problems outside production', () => {
    expect(contentProblems(site, { production: false })).toEqual([]);
  });

  test('flags empty strings anywhere, with their path', () => {
    const broken = { ...site, header: { ...site.header, skip: '   ' } };
    expect(contentProblems(broken, { production: false })).toEqual(['header.skip is empty']);
  });

  /**
   * Every placeholder in the content has to be reported, not a remembered list of the ones
   * we happened to think of. Both sides are derived from the content rather than named
   * here: naming a token makes the test fail on the day someone supplies the real value,
   * which is the one day it ought to stay quiet.
   */
  test('flags every placeholder, and only in production', () => {
    const found = contentPlaceholders(unfinished);
    expect(found.length, 'nothing left to flag, so this test proves nothing').toBeGreaterThan(0);

    const problems = contentProblems(unfinished, { production: true });
    expect(problems).toHaveLength(found.length);
    for (const { path, token } of found) {
      expect(problems).toContain(`${path} is still the ${token} placeholder`);
    }
    expect(contentProblems(unfinished, { production: false })).toEqual([]);
  });

  /**
   * The escape hatch that puts the unfinished site on a public URL. It has to skip the
   * placeholders and nothing else: an empty string is a bug in any environment.
   */
  test('allowPlaceholders opens the gate in production, but only for placeholders', () => {
    expect(contentProblems(unfinished, { production: true, allowPlaceholders: true })).toEqual([]);

    const broken = { ...site, header: { ...site.header, skip: '  ' } };
    expect(contentProblems(broken, { production: true, allowPlaceholders: true })).toEqual(['header.skip is empty']);
  });

  test('the gate still refuses by default, so the hatch has to be asked for', () => {
    expect(contentProblems(unfinished, { production: true }).length).toBeGreaterThan(0);
    expect(contentProblems(site, { production: true })).toEqual([]);
  });

  test('content with nothing left to fill in passes a production build', () => {
    const done = {
      contact: { email: 'hei@example.no', orgnr: '000 000 000' },
      support: { vipps: { value: '123456' } },
    };
    expect(contentProblems(done, { production: true })).toEqual([]);
  });
});

describe('paymentPlaceholders', () => {
  /**
   * These are the reason the loud warning exists: the numbers a visitor would try to send
   * money to, and the number a gift is reported on. If the set ever drifts — a field
   * renamed, another one added — the build log would go quiet about exactly the thing it
   * is there to shout.
   */
  test('finds the payment details, and nothing that is merely unfinished', () => {
    const paths = paymentPlaceholders(unfinished).map((p) => p.path);
    expect(paths).toEqual(['support.account.value']);
    expect(paths).not.toContain('contact.email');
  });

  test('it is a subset of every placeholder, not a separate list that can drift', () => {
    const all = contentPlaceholders(unfinished).map((p) => p.path);
    for (const { path } of paymentPlaceholders(unfinished)) expect(all).toContain(path);
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

  /**
   * None left (2026-11-25): what the foundation has not supplied (the account number, the
   * Facebook and Instagram handles) is left out, not bracketed, so the site can be indexed and
   * the production gate is back on. Anything here is a placeholder someone added.
   */
  test('no placeholder in either language', () => {
    expect(contentPlaceholders(site)).toEqual([]);
    expect(contentPlaceholders(siteEn)).toEqual([]);
  });
});
