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
          * The three boxes share one element because they share the geometry that puts
          * them on the page — the inset, the radius, the margin the copy sits inside — and
          * that is written once, here, so the three cannot drift apart.
          *
          * What they no longer share is a colour. Each box carries one scene of the hero
          * film in ink: the cave, the mosque, the Quran. The film is what runs through
          * them, so everything after the hero belongs inside this.
          */}
        <div className={wash.field}>
          <Vision />
          <Mission />
          <Support />
        </div>
      </main>
      <Footer />
    </>
  );
}
