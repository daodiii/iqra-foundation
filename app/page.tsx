import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { site } from '@/content/site.no';

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <h1 style={{ padding: '120px var(--margin)' }}>{site.hero.h1Lines.join(' ')}.</h1>
      </main>
      <Footer />
    </>
  );
}
