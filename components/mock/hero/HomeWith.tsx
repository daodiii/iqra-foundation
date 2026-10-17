import Link from 'next/link';
import type { ReactNode } from 'react';
import { About } from '@/components/home/About';
import { Contact } from '@/components/home/Contact';
import { Events } from '@/components/home/Events';
import { People } from '@/components/home/People';
import styles from '@/components/home/scene.module.css';
import { Sea } from '@/components/home/Sea';
import { Seal } from '@/components/home/Seal';
import { getEvents, getPeople, splitEvents, todayISO } from '@/lib/content';
import strip from './strip.module.css';

const TAKES = [
  { key: 'i-dag', label: 'I dag', href: '/mock/hero-i-dag' },
  { key: '1', label: '1 Kapitlene', href: '/mock/hero-1' },
  { key: '2', label: '2 Søylen', href: '/mock/hero-2' },
  { key: '3', label: '3 Lerretet', href: '/mock/hero-3' },
  { key: '4', label: '4 Skulpturen', href: '/mock/hero-4' },
  { key: '5', label: '5 Lesningen', href: '/mock/hero-5' },
  { key: '6', label: '6 Fire vinduer', href: '/mock/hero-6' },
  { key: '7', label: '7 Skriften', href: '/mock/hero-7' },
  { key: '8', label: '8 Konstruksjonen', href: '/mock/hero-8' },
  { key: '9', label: '9 Fire felt', href: '/mock/hero-9' },
  { key: '10', label: '10 Plakaten', href: '/mock/hero-10' },
  { key: '11', label: '11 Forsiden', href: '/mock/hero-11' },
  { key: '12', label: '12 Vekten', href: '/mock/hero-12' },
  { key: '13', label: '13 Preget', href: '/mock/hero-13' },
  { key: '14', label: '14 Lyset', href: '/mock/hero-14' },
  { key: '15', label: '15 Hilsenen', href: '/mock/hero-15' },
  { key: '16', label: '16 Byen', href: '/mock/hero-16' },
  { key: '17', label: '17 Ordene', href: '/mock/hero-17' },
  { key: '18', label: '18 Skyggen', href: '/mock/hero-18' },
  { key: '19', label: '19 Bagdad, rød', href: '/mock/hero-19' },
  { key: '20', label: '20 Bagdad, blå', href: '/mock/hero-20' },
  { key: '21', label: '21 Samtalen', href: '/mock/hero-21' },
  { key: '22', label: '22 Skolen', href: '/mock/hero-22' },
  { key: '23', label: '23 Forsamlingen', href: '/mock/hero-23' },
  { key: '24', label: '24 Staden', href: '/mock/hero-24' },
  { key: '25', label: '25 Staden, midtstilt', href: '/mock/hero-25' },
] as const;

/** MOCK: the home page as it is live (app/(site)/page.tsx), with the hero swapped, and a switch between the takes. */
export function HomeWith({ hero, current }: { hero: ReactNode; current: (typeof TAKES)[number]['key'] }) {
  const { upcoming } = splitEvents(getEvents(), todayISO());
  return (
    <>
      {hero}
      <Sea />
      <div className={styles.stage} data-plates>
        <Seal />
        <About />
        <Events upcoming={upcoming} />
        <People people={getPeople()} />
        <Contact />
      </div>
      <details className={strip.strip}>
        <summary className={strip.tab}>{TAKES.find((t) => t.key === current)?.label}</summary>
        <nav className={strip.takes} aria-label="Mockups">
          {TAKES.map((t) => (
            <Link key={t.key} href={t.href} prefetch={false} className={strip.take} aria-current={t.key === current ? 'page' : undefined}>
              {t.label}
            </Link>
          ))}
        </nav>
      </details>
    </>
  );
}
