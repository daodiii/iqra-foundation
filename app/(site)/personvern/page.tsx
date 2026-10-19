import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/LegalPage';
import { privacy } from '@/content/legal.no';

export const metadata: Metadata = { title: privacy.title, description: privacy.description };

/** Personvern: what the site does with information about a visitor, today, in plain words (content/legal.no.ts). */
export default function Personvern() {
  return <LegalPage {...privacy} />;
}
