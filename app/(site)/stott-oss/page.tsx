import type { Metadata } from 'next';
import { Fanene } from '@/components/support/Fanene';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.support.title,
  description: site.pages.support.description,
};

/** Støtt oss: the question, and the three ways to give as three banners. The numbers are bracketed until the foundation has them. */
export default function StottOss() {
  return <Fanene />;
}
