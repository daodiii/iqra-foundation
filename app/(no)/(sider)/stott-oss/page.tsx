import type { Metadata } from 'next';
import { StottPlater } from '@/components/support/StottPlater';
import { copy } from '@/content/copy';
import { pageMeta } from '@/lib/meta';

const LANG = 'no';
const { site } = copy(LANG);

export const metadata: Metadata = pageMeta('support', LANG, { title: site.pages.support.title, description: site.pages.support.description });

/** Støtt oss: what a gift goes to, and the ways to give. */
export default function Page() {
  return <StottPlater lang={LANG} />;
}
