import type { Metadata } from 'next';
import { site } from '@/content/site.no';
import { siteUrl } from '@/lib/site-url';
import { generalSans, supreme } from './fonts';
import './globals.css';

/**
 * One title pattern on every page — «Om oss – Iqra Foundation» — and the name alone on
 * the home page. Pages set only their own part.
 *
 * The site is live while the facts are still bracketed — the Vipps number, the account,
 * the address, the organisation number — so it is kept out of search rather than indexed
 * as it stands. `noindex` only works if crawlers may fetch the page, so there is
 * deliberately no robots.txt disallowing them. Delete `robots` here when the real values
 * land, alongside `build.env.ALLOW_PLACEHOLDERS` in vercel.json; `node
 * scripts/check-content.mjs` lists what is still bracketed.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: site.name, template: `%s – ${site.name}` },
  description: site.pages.home.description,
  robots: { index: false, follow: false },
  /** Each page names itself as the address to count: `./` is resolved against the page's own path and `metadataBase`. */
  alternates: { canonical: './' },
  openGraph: {
    type: 'website',
    locale: 'nb_NO',
    siteName: site.name,
  },
  twitter: { card: 'summary_large_image' },
};

/** html, body and the fonts only: the site's shell is `app/(site)/layout.tsx`, so the admin under /keystatic is not wrapped in it. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.lang} className={`${generalSans.variable} ${supreme.variable}`}>
      <body>{children}</body>
    </html>
  );
}
