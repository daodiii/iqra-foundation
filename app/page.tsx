import { Footer } from '@/components/Footer';
import { Happenings } from '@/components/happenings/Happenings';
import { Header } from '@/components/Header';
import { Hero } from '@/components/hero/Hero';
import { Mission } from '@/components/mission/Mission';
import { People } from '@/components/people/People';
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
          * The boxes share one element because they share the geometry that puts them on
          * the page — the inset, the radius, the margin the copy sits inside — and that is
          * written once, here, so they cannot drift apart. Arrangementer · Nyheter has no
          * box at all and still belongs inside: it takes the same margin, which is what
          * keeps its two columns on the same measure as everything above and below them.
          *
          * What the boxes no longer share is a material. The film runs down them and thins
          * as it goes: the cave and the mosque in ink, then the page's own white, then
          * Arafat under clear water and the ask in green water, with the night on the card
          * at the foot of it. Everything after the hero belongs inside this.
          */}
        <div className={wash.field}>
          <Vision />
          <Mission />
          <Happenings />
          <People />
          <Support />
        </div>
      </main>
      <Footer />
    </>
  );
}
