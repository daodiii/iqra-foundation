import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { Smooth } from '@/components/site/Smooth';

/**
 * The site's shell: every public page is the header, the main region and the footer, and every
 * one glides on a touchpad, a TrackPoint or a mouse (`Smooth`, lib/smooth.ts) — one glide for
 * the whole visit, carried from page to page. The admin (/keystatic) is outside this group and
 * gets none of it.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Smooth />
      <Header />
      <main id="innhold">{children}</main>
      <Footer />
    </>
  );
}
