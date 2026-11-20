import type { Metadata } from 'next';
import { MenneskenePlater } from '@/components/menneskene-bak/MenneskenePlater';
import { site } from '@/content/site.no';
import { getPeople } from '@/lib/content';

export const metadata: Metadata = {
  title: site.pages.people.title,
  description: site.pages.people.description,
};

/**
 * Menneskene bak: the client's text (D4, 2026-11-18) and only the five board members (M4) —
 * name, role, and the photo and short bio when the foundation has supplied them (the
 * `menneskene` collection, edited in the admin) — on «Platene» (mock 42, the owner's pick of
 * 2026-11-20). The foundation council is not shown, as the client asks.
 */
export default function MenneskeneBak() {
  return <MenneskenePlater people={getPeople()} />;
}
