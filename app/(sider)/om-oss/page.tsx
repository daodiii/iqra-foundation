import type { Metadata } from 'next';
import { Kortene } from '@/components/om-oss/Kortene';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.about.title,
  description: site.pages.about.description,
};

/**
 * Om Iqra Foundation: the client's text (D2, 2026-11-18) as «Kortene» (mock 8, 2026-11-20): the
 * purpose, the values, who it is for and the independence, in their order and in their words.
 * «Navnet Iqra» is left out by the owner (2026-11-20).
 */
export default function OmOss() {
  return <Kortene />;
}
