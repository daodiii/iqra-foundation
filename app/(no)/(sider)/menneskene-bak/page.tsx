import type { Metadata } from 'next';
import { MenneskenePlater } from '@/components/menneskene-bak/MenneskenePlater';
import { getPeople } from '@/lib/content';
import { copy } from '@/content/copy';
import { pageMeta } from '@/lib/meta';

const LANG = 'no';
const { site } = copy(LANG);

export const metadata: Metadata = pageMeta('people', LANG, { title: site.pages.people.title, description: site.pages.people.description });

/** Menneskene bak: the board, from the collection (content/menneskene/). */
export default function Page() {
  return <MenneskenePlater people={getPeople()} lang={LANG} />;
}
