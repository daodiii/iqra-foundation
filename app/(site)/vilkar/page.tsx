import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/LegalPage';
import { terms } from '@/content/legal.no';

export const metadata: Metadata = { title: terms.title, description: terms.description };

/** Vilkår: the terms of using the site (content/legal.no.ts). */
export default function Vilkar() {
  return <LegalPage {...terms} />;
}
