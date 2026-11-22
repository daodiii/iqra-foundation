import { klient as klientEn } from './klient.en.ts';
import { klient as klientNo, type Klient } from './klient.no.ts';
import { privacy as privacyEn, terms as termsEn } from './legal.en.ts';
import { privacy as privacyNo, terms as termsNo } from './legal.no.ts';
import type { Loose } from './loose.ts';
import type { Lang } from './paths.ts';
import { site as siteEn } from './site.en.ts';
import { site as siteNo, type Site } from './site.no.ts';

/**
 * Everything a page says, in one language. A server component takes `lang` (Norwegian when it is
 * not given, so every page that was there before reads as it did) and calls `copy(lang)`; a client
 * component reads the same from `useCopy()` (components/site/Lang.tsx).
 */
export type Copy = {
  lang: Lang;
  site: Loose<Site>;
  klient: Loose<Klient>;
};

export const NO: Copy = { lang: 'no', site: siteNo, klient: klientNo };
export const EN: Copy = { lang: 'en', site: siteEn, klient: klientEn };

export const copy = (lang: Lang = 'no'): Copy => (lang === 'en' ? EN : NO);

export const legal = (lang: Lang = 'no') => (lang === 'en' ? { privacy: privacyEn, terms: termsEn } : { privacy: privacyNo, terms: termsNo });
