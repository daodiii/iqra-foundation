import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { site } from '@/content/site.no';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

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
  title: site.meta.title,
  description: site.meta.description,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.lang} className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
