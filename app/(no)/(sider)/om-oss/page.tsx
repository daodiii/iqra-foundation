import type { Metadata } from 'next';
import { OmOssPlater } from '@/components/om-oss/OmOssPlater';
import { copy } from '@/content/copy';
import { pageMeta } from '@/lib/meta';

const LANG = 'no';
const { site } = copy(LANG);

export const metadata: Metadata = pageMeta('about', LANG, { title: site.pages.about.title, description: site.pages.about.description });

/** Om Iqra Foundation: the client's text (D2, 2026-11-18) as «Platene» (mock 42, the owner's pick of 2026-11-20). */
export default function Page() {
  return <OmOssPlater lang={LANG} />;
}
