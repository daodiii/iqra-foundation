import type { Metadata } from 'next';
import { ArbeidPlater } from '@/components/vart-arbeid/ArbeidPlater';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.work.title,
  description: site.pages.work.description,
};

const t = klient.work;

/** A heading as an anchor: «Dialog og gjensidig forståelse» → `dialog-og-gjensidig-forstaelse`. */
function anchor(title: string) {
  return title
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Vårt arbeid as «Platene» (mock 42, the owner's pick for all subpages, 2026-11-20): the client's text
 * (D3, 2026-11-18), the intro and the areas of work in their order, each a full-screen plate with its
 * own anchor. The client's intro says six areas and lists seven; all seven stand here as written until
 * the client says otherwise (their question Q2).
 */
export default function VartArbeid() {
  const areas = t.areas.map((a) => ({
    id: anchor(a.title),
    title: a.title,
    text: a.text,
    note: 'note' in a ? a.note : undefined,
  }));
  return <ArbeidPlater title={t.title} intro={t.intro} areas={areas} />;
}
