import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { About } from '@/components/home/About';
import { Events } from '@/components/home/Events';
import styles from '@/components/home/scene.module.css';
import { Sea } from '@/components/home/Sea';
import { Seal } from '@/components/home/Seal';
import { People, Support } from '@/components/home/Sections';
import { Bar } from '@/components/mock/Bar';
import { DIRS, isDir } from '@/components/mock/dirs';
import { Flommen } from '@/components/mock/Flommen';
import { Fortekst } from '@/components/mock/Fortekst';
import { Gjennom } from '@/components/mock/Gjennom';
import { Glassmaleriet } from '@/components/mock/Glassmaleriet';
import { Havbunnen } from '@/components/mock/Havbunnen';
import { Hjornet } from '@/components/mock/Hjornet';
import { Kornene } from '@/components/mock/Kornene';
import { Linsen } from '@/components/mock/Linsen';
import { Lyset } from '@/components/mock/Lyset';
import { Mosaikken } from '@/components/mock/Mosaikken';
import { Papirkuttet } from '@/components/mock/Papirkuttet';
import { Rommet } from '@/components/mock/Rommet';
import { Speilet } from '@/components/mock/Speilet';
import { Straalene } from '@/components/mock/Straalene';
import { Teppet } from '@/components/mock/Teppet';
import { getEvents, getPeople, splitEvents, todayISO } from '@/lib/content';

/**
 * The hero and the film fifteen ways (/mock/1 … 15): the home page as it is, with the hero
 * replaced by a direction. A tool for one decision, removed once it is made.
 */

const MOCK = { '1': Flommen, '2': Gjennom, '3': Speilet, '4': Fortekst, '5': Hjornet, '6': Kornene, '7': Mosaikken, '8': Havbunnen, '9': Lyset, '10': Glassmaleriet, '11': Linsen, '12': Papirkuttet, '13': Straalene, '14': Rommet, '15': Teppet } as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return DIRS.map((d) => ({ dir: d.key }));
}

export async function generateMetadata({ params }: { params: Promise<{ dir: string }> }): Promise<Metadata> {
  const { dir } = await params;
  const d = DIRS.find((x) => x.key === dir);
  return { title: d ? `Utkast ${d.name}` : 'Utkast', robots: { index: false, follow: false } };
}

export default async function Mock({ params }: { params: Promise<{ dir: string }> }) {
  const { dir } = await params;
  if (!isDir(dir)) notFound();
  const { upcoming } = splitEvents(getEvents(), todayISO());
  const Slot = MOCK[dir];
  return (
    <>
      <Bar dir={dir} />
      <Slot />
      <Sea />
      <div className={styles.stage}>
        <Seal />
      </div>
      <About />
      <div className={styles.stage}>
        <Events upcoming={upcoming} />
      </div>
      <People people={getPeople()} />
      <div className={styles.stage}>
        <Support />
      </div>
    </>
  );
}
