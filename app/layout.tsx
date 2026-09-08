import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { site } from '@/content/site.no';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

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

/** The film's first frame, and the only image the site has that is not the film itself. */
const shareImage = {
  url: '/media/iqra-poster.jpg',
  width: 1920,
  height: 1080,
  alt: site.meta.imageAlt,
};

/**
 * The page is live while the copy is still filler — bank account, Vipps number and the
 * contact address are all placeholders — so it is kept out of search rather than left to
 * be indexed as it stands. `noindex` is the tag that actually removes a page from the
 * index, and it only works if crawlers may fetch the page, so there is deliberately no
 * robots.txt disallowing them.
 *
 * Delete `robots` here when the real content lands, alongside `build.env.ALLOW_PLACEHOLDERS`
 * in vercel.json. `content/site.no.ts` shows what is still bracketed.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: site.meta.title,
  description: site.meta.description,
  robots: { index: false, follow: false },
  /*
   * `noindex` keeps the page out of search; it does nothing to a link pasted into a
   * chat, which is how most people will first meet this site. Without these the card is
   * a bare title on a grey rectangle.
   */
  openGraph: {
    type: 'website',
    locale: 'nb_NO',
    siteName: site.name,
    title: site.meta.title,
    description: site.meta.description,
    images: [shareImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: site.meta.title,
    description: site.meta.description,
    images: [shareImage],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.lang} className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
