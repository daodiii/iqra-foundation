import type { Metadata } from 'next';
import { VartArbeid } from '@/components/vart-arbeid/VartArbeid';
import { copy } from '@/content/copy';
import { pageMeta } from '@/lib/meta';

const LANG = 'en';
const { site } = copy(LANG);

export const metadata: Metadata = pageMeta('work', LANG, { title: site.pages.work.title, description: site.pages.work.description });

/** Vårt arbeid: the areas of work, a plate each (components/vart-arbeid/VartArbeid.tsx). */
export default function Page() {
  return <VartArbeid lang={LANG} />;
}
