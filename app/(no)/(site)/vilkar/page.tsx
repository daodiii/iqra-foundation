import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/LegalPage';
import { legal } from '@/content/copy';
import { pageMeta } from '@/lib/meta';

const text = legal('no').terms;

export const metadata: Metadata = pageMeta('terms', 'no', { title: text.title, description: text.description });

/** Vilkår, in plain words (content/legal.no.ts): a draft until the foundation has read it. */
export default function Page() {
  return <LegalPage {...text} lang="no" />;
}
