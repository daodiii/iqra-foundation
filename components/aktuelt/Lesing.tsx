'use client';

import { useEffect, useRef, useState } from 'react';
import type { Part } from '@/lib/outline';
import s from './artikkel.module.css';

/**
 * Where you are in an article and how far you have read (Artikkel 4, 2026-11-19). Beside the
 * text on a wide screen: the date, «I denne saken» with the part you are in marked, a line that
 * fills as you read. On a phone: a bar under the header with the part and the share read; a tap
 * opens the list. Without script it is a plain list of links.
 */
/** The box's own words, per language of the page. */
export const LESING_WORDS = {
  no: { inThis: 'I denne saken', about: 'Om saken', read: 'Du har lest' },
  en: { inThis: 'In this article', about: 'About the article', read: 'You have read' },
} as const;

/**
 * `words` is the page's language; `partsLang` is the language the parts are written in, when it
 * differs (an English page around a Norwegian article), so a screen reader reads them right.
 */
export function Lesing({ parts, textId, meta, words = LESING_WORDS.no, partsLang }: {
  parts: Part[]; textId: string; meta: React.ReactNode; words?: (typeof LESING_WORDS)[keyof typeof LESING_WORDS]; partsLang?: string;
}) {
  const [cur, setCur] = useState(0);
  const [read, setRead] = useState(0);
  const [open, setOpen] = useState(false);
  const frame = useRef(0);

  useEffect(() => {
    const text = document.getElementById(textId);
    if (!text) return;
    const heads = parts.map((p) => document.getElementById(p.id));
    const update = () => {
      frame.current = 0;
      const r = text.getBoundingClientRect();
      // A text with no height yet (not laid out) has nothing read.
      const p = r.height > 0 ? Math.min(1, Math.max(0, (innerHeight * 0.5 - r.top) / r.height)) : 0;
      let c = 0;
      heads.forEach((h, i) => { if (h && h.getBoundingClientRect().top < innerHeight * 0.4) c = i; });
      if (p > 0.9) c = heads.length - 1; // the last part is often short: at the end, it is where you are
      setRead(p);
      setCur(c);
    };
    const ask = () => { if (!frame.current) frame.current = requestAnimationFrame(update); };
    update();
    addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', ask);
    return () => { removeEventListener('scroll', ask); removeEventListener('resize', ask); cancelAnimationFrame(frame.current); };
  }, [parts, textId]);

  const pct = `${Math.round(read * 100)} %`;
  const style = { '--p': read } as React.CSSProperties;
  const links = (onPick?: () => void) =>
    parts.map((p, i) => (
      <li key={p.id}>
        <a href={`#${p.id}`} lang={partsLang} aria-current={i === cur ? 'location' : undefined} data-done={i < cur || undefined} onClick={onPick}>
          {p.text}
        </a>
      </li>
    ));

  return (
    <>
      {parts.length > 0 && (
        <div className={s.bar} style={style}>
          <button type="button" aria-expanded={open} aria-controls="lesing-liste" onClick={() => setOpen((o) => !o)}>
            {words.inThis} <span lang={partsLang}>{parts[cur]?.text}</span><b>{pct}</b>
          </button>
          <div className={s.barLine} aria-hidden="true"><i /></div>
          <ol id="lesing-liste" hidden={!open}>{links(() => setOpen(false))}</ol>
        </div>
      )}
      <aside className={s.side} aria-label={words.about}>
        <div className={s.stick}>
          {meta}
          {parts.length > 0 && (
            <nav aria-labelledby="lesing-tittel">
              <p id="lesing-tittel" className={s.tocTitle}>{words.inThis}</p>
              <div className={s.toc} style={style}>
                <span className={s.track} aria-hidden="true"><span /></span>
                <ol>{links()}</ol>
              </div>
              <p className={s.read} aria-live="off">{words.read} {pct}</p>
            </nav>
          )}
        </div>
      </aside>
    </>
  );
}
