import type { Metadata } from 'next';
import { JsonLd } from '@/components/site/JsonLd';
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
 * Open to search since 2026-11-25. Until then every page was `noindex` while the facts were
 * still bracketed; the last three (the account number, Instagram, Facebook) were left off
 * rather than filled, so nothing bracketed reaches a page. The content gate is back on for
 * production builds (`scripts/check-content.mjs`): a new placeholder now stops the deploy.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: site.name, template: `%s – ${site.name}` },
  description: site.pages.home.description,
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
      <body>
        <JsonLd lang="en" />
        <LangProvider copy={EN}>{children}</LangProvider>
      </body>
    </html>
  );
}
