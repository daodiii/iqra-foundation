import { klient } from '@/content/klient.no';
import { site as siteEn } from '@/content/site.en';
import { site } from '@/content/site.no';
import { siteUrl } from './site-url';

/**
 * The foundation and the website as schema.org JSON-LD (2026-11-25, from the SEO audit): one NGO and
 * one WebSite, each with a stable @id shared by both languages, so search and AI engines read one
 * entity rather than guessing it from the page text. Every value comes from the site's own content,
 * except the founding date, which the site does not state and Enhetsregisteret does.
 * Rendered in both root layouts (components/site/JsonLd.tsx).
 */

/** Enhetsregisteret's «stiftelsesdato» for 817 388 752 (data.brreg.no, read 2026-11-25). */
const FOUNDED = '2016-02-23';

type Node = Record<string, unknown> & { '@type': string };

export function siteGraph(lang: 'nb' | 'en'): { '@context': string; '@graph': Node[] } {
  const c = klient.contact;
  const [postalCode, ...place] = c.postcode.split(' ');
  const org = `${siteUrl}/#organization`;
  const orgnr = c.orgnr.replace(/\s/g, '');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NGO',
        '@id': org,
        name: site.name,
        legalName: c.name,
        url: siteUrl,
        logo: { '@type': 'ImageObject', url: `${siteUrl}/brand/iqra-logo.svg` },
        description: (lang === 'en' ? siteEn : site).pages.home.description,
        foundingDate: FOUNDED,
        email: c.email,
        telephone: c.phone,
        address: {
          '@type': 'PostalAddress',
          postOfficeBoxNumber: c.postbox.replace(/\D/g, ''),
          postalCode,
          addressLocality: place.join(' '),
          addressCountry: 'NO',
        },
        identifier: { '@type': 'PropertyValue', propertyID: 'Organisasjonsnummer', value: orgnr },
        // ISO 6523 with 0192, Brønnøysund's organisasjonsnummer: the identifier Google's Organization docs list
        iso6523Code: `0192:${orgnr}`,
        contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: c.email, telephone: c.phone, availableLanguage: ['nb', 'en'] },
        // the public register's own page for the foundation; the social profiles join when they are known
        sameAs: [`https://virksomhet.brreg.no/nb/oppslag/enheter/${orgnr}`],
        knowsLanguage: ['nb', 'en'],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: site.name,
        inLanguage: ['nb', 'en'],
        publisher: { '@id': org },
      },
    ],
  };
}
