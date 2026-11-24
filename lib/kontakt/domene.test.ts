import { describe, expect, test } from 'vitest';
import { mailDomainOk } from './domene';

const err = (code: string) => Object.assign(new Error(code), { code });
const dns = (o: { mx?: () => Promise<{ exchange: string; priority: number }[]>; a?: () => Promise<string[]>; aaaa?: () => Promise<string[]> }) => ({
  resolveMx: o.mx ?? (() => Promise.reject(err('ENODATA'))),
  resolve4: o.a ?? (() => Promise.reject(err('ENODATA'))),
  resolve6: o.aaaa ?? (() => Promise.reject(err('ENODATA'))),
});

describe('mailDomainOk: can this domain receive mail?', () => {
  test('a domain with a mail server passes (gmail.com, outlook.com, a company’s own)', async () => {
    expect(await mailDomainOk('gmail.com', dns({ mx: async () => [{ exchange: 'gmail-smtp-in.l.google.com', priority: 5 }] }))).toBe(true);
  });

  test('a domain that does not exist is refused (gmail.con, a typo)', async () => {
    expect(await mailDomainOk('gmail.con', dns({ mx: () => Promise.reject(err('ENOTFOUND')) }))).toBe(false);
  });

  test('a domain that says it takes no mail (null MX «.») is refused', async () => {
    expect(await mailDomainOk('example.com', dns({ mx: async () => [{ exchange: '', priority: 0 }] }))).toBe(false);
    expect(await mailDomainOk('example.com', dns({ mx: async () => [{ exchange: '.', priority: 0 }] }))).toBe(false);
  });

  test('no MX but an address record still receives mail (the old fallback), none at all is refused', async () => {
    expect(await mailDomainOk('liten.no', dns({ a: async () => ['192.0.2.1'] }))).toBe(true);
    expect(await mailDomainOk('liten.no', dns({ aaaa: async () => ['2001:db8::1'] }))).toBe(true);
    expect(await mailDomainOk('tom.no', dns({}))).toBe(false);
  });

  test('when DNS itself is in trouble (timeout, server failure) the writer is not blocked', async () => {
    for (const code of ['ETIMEOUT', 'ESERVFAIL', 'ECONNREFUSED']) {
      expect(await mailDomainOk('kari.no', dns({ mx: () => Promise.reject(err(code)) }))).toBe(true);
    }
  });
});
