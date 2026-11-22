import type { Metadata } from 'next';
import { RessurserPlater } from '@/components/ressurser/RessurserPlater';
import { getResources } from '@/lib/content';
import { copy } from '@/content/copy';
import { pageMeta } from '@/lib/meta';

const LANG = 'en';
const { site } = copy(LANG);

export const metadata: Metadata = pageMeta('resources', LANG, { title: site.pages.resources.title, description: site.pages.resources.description });

/** Ressurser: the library, a plate per category (content/ressurser/). */
export default function Page() {
  return <RessurserPlater items={getResources()} lang={LANG} />;
}
