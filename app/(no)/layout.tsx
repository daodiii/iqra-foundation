import type { Metadata } from 'next';
import { copy } from '@/content/copy';
import { JsonLd } from '@/components/site/JsonLd';
import { siteUrl } from '@/lib/site-url';
import { generalSans, supreme } from '../fonts';
import '../globals.css';

const { site } = copy('no');

/**
 * The Norwegian site's root layout: everything outside /en and /keystatic (2026-11-22, when the English site got a root of its own so each page says its own `lang`).
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
    locale: 'nb_NO',
    alternateLocale: 'en_GB',
    siteName: site.name,
  },
  twitter: { card: 'summary_large_image' },
};

/** html, body and the fonts only: the shells are `components/site/Shells.tsx`, so the admin under /keystatic is not wrapped in them. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.lang} className={`${generalSans.variable} ${supreme.variable}`}>
      <body>
        <JsonLd lang="nb" />
        {children}
      </body>
    </html>
  );
}
