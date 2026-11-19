import { notFound } from 'next/navigation';
import { NyhetEditor } from '@/components/redaksjon/NyhetEditor';
import { todayISO } from '@/lib/content';
import { opened } from '@/lib/redaksjon/load';
import { blank, isSection, type Nyhet } from '@/lib/redaksjon/schema';

/** Writing: `/redaksjon/<section>/ny` for a new post, `/redaksjon/<section>/<address>` to edit one. */
export default async function Skriv({ params }: PageProps<'/redaksjon/[section]/[slug]'>) {
  const { section, slug } = await params;
  if (!isSection(section) || section !== 'nyheter') notFound(); // the other sections come in phase 3
  // A fresh key each time: «Skriv nytt» from a post saved in this visit must start empty.
  if (slug === 'ny') return <NyhetEditor key={crypto.randomUUID()} initial={blank('nyheter', todayISO())} slug={null} version={null} />;
  const entry = await opened('nyheter', slug);
  if (!entry) notFound();
  return <NyhetEditor key={slug} initial={entry.fields as Nyhet} slug={entry.slug} version={entry.version} />;
}
