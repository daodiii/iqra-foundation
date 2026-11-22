import type { Metadata } from 'next';
import { LangProvider } from '@/components/site/Lang';
import { EN } from '@/content/copy';
import { copy } from '@/content/copy';
import { siteUrl } from '@/lib/site-url';
import { generalSans, supreme } from '../fonts';
import '../globals.css';

const { site } = copy('en');

/**
 * The English site's root layout, everything under /en (2026-11-22). Its client components read their words from `LangProvider`, so the English copy reaches the browser only on English pages.
 *
 * One title pattern on every page — «Om oss – Iqra Foundation» — and the name alone on
 * the home page. Pages set only their own part.
 *
 * The site is live while the facts are still bracketed — the Vipps number, the account,
 * the address, the organisation number — so it is kept out of search rather than indexed
 * as it stands. `noindex` only works if crawlers may fetch the page, so there is
 * deliberately no robots.txt disallowing them. Delete `robots` here (in both languages'
 * root layouts) when the real values land, alongside `build.env.ALLOW_PLACEHOLDERS` in
 * vercel.json; `node scripts/check-content.mjs` lists what is still bracketed.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: site.name, template: `%s – ${site.name}` },
  description: site.pages.home.description,
  robots: { index: false, follow: false },
  /** Each page names itself as the address to count, and its twin in the other language (lib/meta.ts). */
  alternates: { canonical: './' },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    alternateLocale: 'nb_NO',
    siteName: site.name,
  },
  twitter: { card: 'summary_large_image' },
};

/** html, body and the fonts only: the shells are `components/site/Shells.tsx`, so the admin under /keystatic is not wrapped in them. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.lang} className={`${generalSans.variable} ${supreme.variable}`}>
      <body><LangProvider copy={EN}>{children}</LangProvider></body>
    </html>
  );
}
