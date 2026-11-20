import type { Metadata } from 'next';
import { StottPlater } from '@/components/support/StottPlater';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.support.title,
  description: site.pages.support.description,
};

/**
 * Støtt oss: the client's text (D7, 2026-11-18), in their order and their words, on «Platene» (mock 42,
 * the owner's pick for every subpage, 2026-11-20): the title and the intro on white, what a gift goes to
 * on navy, the three ways to give on white — under «Gave» the Vipps number and AvtaleGiro, and the
 * account number once the client has given it (their question Q6) — and their last line on crimson.
 */
export default function StottOss() {
  return <StottPlater />;
}
