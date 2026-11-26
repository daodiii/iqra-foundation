'use client';

import { useMemo, useState } from 'react';
import type { Row } from '@/lib/redaksjon/entries';
import { Rows } from './Rows';
import s from './start.module.css';

type Show = 'alle' | 'ute' | 'utkast';
const SHOW: [Show, string][] = [['alle', 'Alle'], ['ute', 'På nettsiden'], ['utkast', 'Utkast']];

/** Lower case without accents, so «Ø» finds «ø» and «e» finds «é». */
const fold = (v: string) => v.toLocaleLowerCase('nb').normalize('NFKD').replace(/[̀-ͯ]/g, '');

/**
 * A section's list with a search over titles and their line, and for news (the one section with
 * drafts) the choice «Alle», «På nettsiden» or «Utkast».
 */
export function SectionList({ rows, today, drafts }: { rows: Row[]; today: string; drafts: boolean }) {
  const [q, setQ] = useState('');
  const [show, setShow] = useState<Show>('alle');
  const shown = useMemo(() => {
    const words = fold(q).split(/\s+/).filter(Boolean);
    return rows.filter((r) => {
      if (show === 'ute' && r.draft) return false;
      if (show === 'utkast' && !r.draft) return false;
      const hay = fold(`${r.title} ${r.sub}`);
      return words.every((w) => hay.includes(w));
    });
  }, [rows, q, show]);

  return (
    <>
      <div className={s.tools}>
        <label className={s.search}>
          <span className={s.srOnly}>Søk</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Søk" />
        </label>
        {drafts && (
          <div className={s.seg} role="group" aria-label="Vis">
            {SHOW.map(([k, label]) => (
              <button key={k} type="button" aria-pressed={show === k} onClick={() => setShow(k)}>{label}</button>
            ))}
          </div>
        )}
      </div>
      {shown.length
        ? <Rows rows={shown} today={today} kind={false} />
        : <p className={s.empty} role="status">Ingen treff.</p>}
    </>
  );
}
