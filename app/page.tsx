import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Hero } from '@/components/hero/Hero';
import { Mission } from '@/components/mission/Mission';
import { Vision } from '@/components/vision/Vision';

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Vision />
        <Mission />
      </main>
      <Footer />
    </>
  );
}
