import type { Metadata } from 'next';
import { Ikonene } from '@/components/contact/Ikonene';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.contact.title,
  description: site.pages.contact.description,
};

/** Kontakt: the e-mail, the number and the post box as three colour bands with drawn icons, and the form, not yet wired, under «Kontakt oss». */
export default function Kontakt() {
  return <Ikonene />;
}
