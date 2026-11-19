import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/redaksjon/Icon';
import { Rows } from '@/components/redaksjon/Rows';
import s from '@/components/redaksjon/start.module.css';
import { todayISO } from '@/lib/content';
import { rowsOf } from '@/lib/redaksjon/load';
import { isSection, LABELS } from '@/lib/redaksjon/schema';

const NEW: Record<string, string> = { nyheter: 'Ny nyhet', arrangementer: 'Nytt arrangement', ressurser: 'Ny ressurs', menneskene: 'Ny person' };

/** A section's posts, newest first (people in their running order). */
export default async function Seksjon({ params }: PageProps<'/redaksjon/[section]'>) {
  const { section } = await params;
  if (!isSection(section)) notFound();
  const rows = await rowsOf(section);
  return (
    <main className={s.page}>
      <div className={s.listHead}>
        <h1>{LABELS[section].many}</h1>
        <Link className={s.newBtn} href={`/redaksjon/${section}/ny`}><Icon name="plus" />{NEW[section]}</Link>
      </div>
      {rows.length
        ? <Rows rows={rows} today={todayISO()} kind={false} />
        : <p className={s.empty}>Ingen innlegg ennå. <Link href={`/redaksjon/${section}/ny`}>{NEW[section]}</Link></p>}
    </main>
  );
}
