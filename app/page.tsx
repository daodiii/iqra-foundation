import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Hero } from '@/components/hero/Hero';
import { Mission } from '@/components/mission/Mission';
import { Support } from '@/components/support/Support';
import { Vision } from '@/components/vision/Vision';
import wash from '@/components/wash.module.css';

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        {/*
          * Visjon and Misjon share one wash, so it has to be one element around both of
          * them: give each section its own and the colour would restart at the seam. The
          * hero is film and Stott oss is already night, so the white middle of the page
          * is exactly these two.
          */}
        <div className={wash.field}>
          <Vision />
          <Mission />
        </div>
        <Support />
      </main>
      <Footer />
    </>
  );
}
