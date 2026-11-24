import { notFound } from 'next/navigation';
import { ArrangementEditor } from '@/components/redaksjon/ArrangementEditor';
import { NyhetEditor } from '@/components/redaksjon/NyhetEditor';
import { todayISO } from '@/lib/content';
import { opened } from '@/lib/redaksjon/load';
import { blank, isSection, type Arrangement, type EntryOf, type Nyhet, type Section } from '@/lib/redaksjon/schema';

/** Writing: `/redaksjon/<section>/ny` for a new post, `/redaksjon/<section>/<address>` to edit one. */
export default async function Skriv({ params }: PageProps<'/redaksjon/[section]/[slug]'>) {
  const { section, slug } = await params;
  if (!isSection(section)) notFound();
  const today = todayISO();
  let entry: { fields: EntryOf[Section]; slug: string | null; version: string | null };
  if (slug === 'ny') {
    entry = { fields: blank(section, today), slug: null, version: null };
  } else {
    const found = await opened(section, slug);
    if (!found) notFound();
    entry = found;
  }
  // A fresh key for an empty sheet: «Nytt innlegg» from a post saved in this visit must start empty.
  const key = entry.slug ?? crypto.randomUUID();
  switch (section) {
    case 'nyheter':
      return <NyhetEditor key={key} initial={entry.fields as Nyhet} slug={entry.slug} version={entry.version} />;
    case 'arrangementer':
      return <ArrangementEditor key={key} initial={entry.fields as Arrangement} slug={entry.slug} version={entry.version} today={today} />;
    default:
      notFound();
  }
}
