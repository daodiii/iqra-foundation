import { describe, expect, test } from 'vitest';
import { siteGraph } from './schema';
import { siteUrl } from './site-url';

/** The facts as Enhetsregisteret gives them (data.brreg.no, checked 2026-11-25), written out here, not read from the site. */
const BRREG = { legalName: 'Iqra Foundation STI', orgnr: '817388752', founded: '2016-02-23', box: '9044', postcode: '0133' };

describe('siteGraph: the foundation and the site, as JSON-LD', () => {
  const no = siteGraph('nb');
  const en = siteGraph('en');
  const node = (g: ReturnType<typeof siteGraph>, type: string) => g['@graph'].find((n) => n['@type'] === type) as Record<string, unknown>;

  test('one NGO with the register’s facts, the same @id in both languages', () => {
    const org = node(no, 'NGO');
    expect(org['@id']).toBe(`${siteUrl}/#organization`);
    expect(node(en, 'NGO')['@id']).toBe(org['@id']);
    expect(org).toMatchObject({
      name: 'Iqra Foundation',
      legalName: BRREG.legalName,
      url: siteUrl,
      foundingDate: BRREG.founded,
      email: 'post@iqrasti.no',
      telephone: '+47 941 43 585',
      identifier: { '@type': 'PropertyValue', propertyID: 'Organisasjonsnummer', value: BRREG.orgnr },
      address: { '@type': 'PostalAddress', postOfficeBoxNumber: BRREG.box, postalCode: BRREG.postcode, addressLocality: 'Oslo', addressCountry: 'NO' },
    });
    expect(String((org.logo as { url: string }).url)).toBe(`${siteUrl}/brand/iqra-logo.svg`);
  });

  test('the org number as Google lists it, a contact point, and the register entry as sameAs', () => {
    const org = node(no, 'NGO');
    expect(org.iso6523Code).toBe(`0192:${BRREG.orgnr}`);
    expect(org.contactPoint).toEqual({ '@type': 'ContactPoint', contactType: 'customer support', email: 'post@iqrasti.no', telephone: '+47 941 43 585', availableLanguage: ['nb', 'en'] });
    expect(org.sameAs).toEqual([`https://virksomhet.brreg.no/nb/oppslag/enheter/${BRREG.orgnr}`]);
  });

  test('the description is in the page’s language', () => {
    expect(node(no, 'NGO').description).toMatch(/^Iqra Foundation er en allmennyttig stiftelse i Oslo/);
    expect(node(en, 'NGO').description).toMatch(/^Iqra Foundation is a/);
  });

  test('the WebSite names the foundation as publisher and speaks both languages', () => {
    const site = node(no, 'WebSite');
    expect(site).toMatchObject({ '@id': `${siteUrl}/#website`, name: 'Iqra Foundation', url: siteUrl, inLanguage: ['nb', 'en'], publisher: { '@id': `${siteUrl}/#organization` } });
  });

  test('no placeholder and no empty value anywhere in it', () => {
    for (const g of [no, en]) {
      const json = JSON.stringify(g);
      expect(json).not.toMatch(/\[[A-ZÆØÅ_.]+\]/);
      expect(json).not.toMatch(/:""/);
    }
  });
});
