import type { Metadata } from 'next';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { site } from '@/content/site.no';
import { generalSans, supreme } from './fonts';
import './globals.css';

/**
 * Absolute URLs for the share card. Read from the environment rather than written down:
 * the production host is a Vercel-assigned name today and a real domain later, and a
 * hardcoded one would keep pointing at the old place long after it stopped being true.
 * `VERCEL_PROJECT_PRODUCTION_URL` is the production host on every deploy, preview builds
 * included, which is what a canonical share card wants — never the per-deploy URL.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

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
  openGraph: {
    type: 'website',
    locale: 'nb_NO',
    siteName: site.name,
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.lang} className={`${generalSans.variable} ${supreme.variable}`}>
      <body>
        <Header />
        <main id="innhold">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
