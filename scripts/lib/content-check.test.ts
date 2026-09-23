import { describe, expect, test } from 'vitest';
import { contentPlaceholders, contentProblems, paymentPlaceholders } from './content-check.mjs';
import { site } from '@/content/site.no';

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
   * placeholders and nothing else: an empty string is a bug in any environment.
   */
  test('allowPlaceholders opens the gate in production, but only for placeholders', () => {
    expect(contentProblems(site, { production: true, allowPlaceholders: true })).toEqual([]);

    const broken = { ...site, header: { ...site.header, skip: '  ' } };
    expect(contentProblems(broken, { production: true, allowPlaceholders: true })).toEqual(['header.skip is empty']);
  });

  test('the gate still refuses by default, so the hatch has to be asked for', () => {
    expect(contentProblems(site, { production: true }).length).toBeGreaterThan(0);
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
    const paths = paymentPlaceholders(site).map((p) => p.path);
    expect(paths).toEqual(['contact.orgnr', 'support.account.value']);
    expect(paths).not.toContain('contact.email');
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

  /**
   * What the site still lacks, exactly: the e-mail, the organisation number and the account
   * number (the Vipps number arrived 2026-09-23), and what the Kontakt page asks for — the street and
   * the postcode, the number, the hours, the way there, the three places to follow.
   * Nothing else on the site is a stand-in — the collections ship empty and the prose is
   * the brief's — so anything more here is a placeholder someone added and should
   * account for.
   */
  test('the facts the foundation has not supplied are the only placeholders', () => {
    const paths = contentPlaceholders(site).map((p) => p.path).sort();
    expect(paths).toEqual([
      'contact.address.postcode',
      'contact.address.street',
      'contact.email',
      'contact.follow[0].href',
      'contact.follow[1].href',
      'contact.follow[2].href',
      'contact.hours',
      'contact.orgnr',
      'contact.phone',
      'contact.transit',
      'support.account.value',
    ]);
  });
});
