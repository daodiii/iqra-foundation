import type { Metadata } from 'next';
import { RessurserPlater } from '@/components/ressurser/RessurserPlater';
import { site } from '@/content/site.no';
import { getResources } from '@/lib/content';

export const metadata: Metadata = {
  title: site.pages.resources.title,
  description: site.pages.resources.description,
};

/**
 * Ressurser: the library (M5 and D6, 2026-11-18) as «Platene» (mock 42, the owner's pick of 2026-11-20).
 * The client's intro, then the four categories in their order — Publikasjoner og rapporter, Artikler og
 * fagstoff, Videoer og presentasjoner, Styringsdokumenter — a plate each with its own anchor, the
 * client's text where they gave one, and what is published in it, newest first. A video plays on the
 * page. Everything is added and changed in the admin (the `ressurser` collection, by category).
 */
export default function Ressurser() {
  return <RessurserPlater items={getResources()} />;
}
