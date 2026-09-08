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
};

export default function OmOss() {
  return (
    <>
      <Header />
      <main>
        <Book />
      </main>
      <Footer />
    </>
  );
}
