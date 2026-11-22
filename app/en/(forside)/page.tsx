import type { Metadata } from 'next';
import { Forside } from '@/components/forside/Forside';
import { pageMeta } from '@/lib/meta';

const LANG = 'en';

export const metadata: Metadata = pageMeta('home', LANG);

export const revalidate = 3600;

/** Hjem: the owner's redesigned front page (2026-11-18/19), section by section (components/forside/). The next events are chosen by today's date: regenerated at most once an hour, so a passed event leaves within the hour. */
export default function Page() {
  return <Forside lang={LANG} />;
}
