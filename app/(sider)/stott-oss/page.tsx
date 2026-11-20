import type { Metadata } from 'next';
import { Grunnmuren } from '@/components/support/Grunnmuren';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.support.title,
  description: site.pages.support.description,
};

/**
 * Støtt oss: the client's text (D7, 2026-11-18), in their order and their words, as 30
 * «Grunnmuren» (the owner's pick, 2026-11-20): the title, what a gift goes to as five stones
 * laid into a foundation, the three ways to give — under «Gave» the Vipps number and AvtaleGiro,
 * and the account number once the client has given it (their question Q6) — and their last line.
 */
export default function StottOss() {
  return <Grunnmuren />;
}
