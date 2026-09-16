import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';

/** The site's shell: every public page is the header, the main region and the footer. The admin (/keystatic) is outside this group and gets none of it. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="innhold">{children}</main>
      <Footer />
    </>
  );
}
