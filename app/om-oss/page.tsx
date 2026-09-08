import type { Metadata } from 'next';
// BookFigure, not Book: on a case-insensitive filesystem './Book' resolves to
// book.ts, the renderer. Same reason components/vision names TreeFigure.
import { Book } from '@/components/about/BookFigure';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.about.meta.title,
  description: site.about.meta.description,
  // Nested metadata is replaced, not merged: without this the card for /om-oss would
  // carry the landing page's title and description from the root layout.
  openGraph: {
    type: 'article',
    locale: 'nb_NO',
    siteName: site.name,
    title: site.about.meta.title,
    description: site.about.meta.description,
    images: [{ url: '/media/iqra-poster.jpg', width: 1920, height: 1080, alt: site.meta.imageAlt }],
  },
};

export default function OmOss() {
  return (
    <>
      <Header ground />
      <main>
        <Book />
      </main>
      <Footer />
    </>
  );
}
