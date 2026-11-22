import type { Metadata } from 'next';
import { KontaktPlater } from '@/components/contact/KontaktPlater';
import { copy } from '@/content/copy';
import { pageMeta } from '@/lib/meta';

const LANG = 'en';
const { site } = copy(LANG);

export const metadata: Metadata = pageMeta('contact', LANG, { title: site.pages.contact.title, description: site.pages.contact.description });

/** Kontakt: the ways to reach the foundation, and the drawn form. */
export default function Page() {
  return <KontaktPlater lang={LANG} />;
}
