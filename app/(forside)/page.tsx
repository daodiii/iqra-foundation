import { Forside } from '@/components/forside/Forside';

/**
 * The next events are chosen by today's date, and the page is prerendered — regenerated at
 * most once an hour, on the first visit after the hour, so an event that has passed leaves
 * the front page within the hour. The records are read from disk then, so `next.config.ts`
 * traces `content/` into this route's function.
 */
export const revalidate = 3600;

/** Hjem: the owner's redesigned front page (2026-11-18/19), section by section (components/forside/). */
export default function Home() {
  return <Forside />;
}
