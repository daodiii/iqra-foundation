import type { Metadata } from 'next';
import { Kortene } from '@/components/contact/Kortene';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.contact.title,
  description: site.pages.contact.description,
};

/** Kontakt: the map, the address, the e-mail, the number, the hours, the way there and a drawn form, as cards. Every value but the place is bracketed until the foundation has it. */
export default function Kontakt() {
  return <Kortene />;
}
