import Link from 'next/link';
import type { Row } from '@/lib/redaksjon/entries';
import { LABELS } from '@/lib/redaksjon/schema';
import { Icon } from './Icon';
import s from './start.module.css';

const MONTHS = ['jan.', 'feb.', 'mars', 'apr.', 'mai', 'juni', 'juli', 'aug.', 'sep.', 'okt.', 'nov.', 'des.'];

/** «i dag», «i går», «12. nov.», or «12. nov. 2025» for another year. */
export function shortDate(iso: string, today: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  if (iso === today) return 'i dag';
  const d = new Date(iso + 'T12:00:00Z');
  const y = new Date(today + 'T12:00:00Z');
  if (y.getTime() - d.getTime() === 86_400_000) return 'i går';
  const s = `${d.getUTCDate()}. ${MONTHS[d.getUTCMonth()]}`;
  return iso.slice(0, 4) === today.slice(0, 4) ? s : `${s} ${iso.slice(0, 4)}`;
}

/** A list of posts: title with its line, the kind, the date and whether it is on the site. */
export function Rows({ rows, today, kind = true }: { rows: Row[]; today: string; kind?: boolean }) {
  return (
    <ul className={s.rows}>
      {rows.map((r) => (
        <li key={`${r.section}/${r.slug}`}>
          <Link href={`/redaksjon/${r.section}/${r.slug}`} className={s.row} data-kind={kind || undefined}>
            <span className={s.t}>{r.title}{r.sub && <small>{r.sub}</small>}</span>
            {kind && <span className={s.k}>{LABELS[r.section].one}</span>}
            <span className={s.d}>{shortDate(r.date, today)}</span>
            {r.draft
              ? <span className={`${s.state} ${s.draft}`}><Icon name="clock" />Utkast</span>
              : <span className={`${s.state} ${s.live}`}><Icon name="globe" />På nettsiden</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
