import Link from 'next/link';
import { Icon } from '@/components/redaksjon/Icon';
import { Rows } from '@/components/redaksjon/Rows';
import s from '@/components/redaksjon/start.module.css';
import { todayISO } from '@/lib/content';
import { latest } from '@/lib/redaksjon/load';

/** The start page (mockup A): three ways in, and the newest posts. */
export default async function Oversikt() {
  const rows = await latest();
  return (
    <main className={s.page}>
      <h1>Hva vil du dele i dag?</h1>
      <p className={s.sub}>Alt du lagrer her, kommer på nettsiden etter et par minutter.</p>
      <div className={s.starts}>
        <Link className={`${s.start} ${s.lead}`} href="/redaksjon/nyheter/ny">
          <Icon name="news" /><strong>Ny nyhet</strong><span>Overskrift, ingress, bilde og tekst</span>
        </Link>
        <Link className={s.start} href="/redaksjon/arrangementer/ny">
          <Icon name="cal" /><strong>Nytt arrangement</strong><span>Dato, sted og påmelding</span>
        </Link>
        <Link className={s.start} href="/redaksjon/ressurser/ny">
          <Icon name="book" /><strong>Ny ressurs</strong><span>PDF, video eller lenke</span>
        </Link>
      </div>
      <section className={s.sec} aria-labelledby="sist">
        <div className={s.secHead}><h2 id="sist">Sist endret</h2><Link href="/redaksjon/nyheter">Se alle nyheter</Link></div>
        {rows.length ? <Rows rows={rows} today={todayISO()} /> : <p className={s.empty}>Ingenting her ennå.</p>}
      </section>
    </main>
  );
}
