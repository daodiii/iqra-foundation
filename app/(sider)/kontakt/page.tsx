import type { Metadata } from 'next';
import { KontaktPlater } from '@/components/contact/KontaktPlater';
import { site } from '@/content/site.no';

export const metadata: Metadata = {
  title: site.pages.contact.title,
  description: site.pages.contact.description,
};

/** Kontakt on «Platene»: the title and the page's text, the e-mail, the number and the post box as large lines on navy, and the form, not yet wired, under «Kontakt oss». */
export default function Kontakt() {
  return <KontaktPlater />;
}
