import { Forside } from '@/components/home/Forside';
import { Hero } from '@/components/home/Hero';

/**
 * The next events are chosen by today's date, and the page is prerendered — regenerated at
 * most once an hour, on the first visit after the hour, so an event that has passed leaves
 * the front page within the hour. The records are read from disk then, so `next.config.ts`
 * traces `content/` into this route's function.
 */
export const revalidate = 3600;

/**
 * Hjem: the client's front page (D1 and M2, 2026-11-18). The logo on navy with the client's
 * headline, text and two buttons (Hero); then their sections in their order (Forside).
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Forside />
    </>
  );
}
