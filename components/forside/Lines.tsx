'use client';

import { useLayoutEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import styles from './forside.module.css';

/**
 * A text that glides in line by line: each line rises out of its own mask (`on` sets them going).
 * The lines are the ones the browser lays out: the text is first set as words, each word's top is
 * read, and the words are gathered into lines. It is measured again when the web font arrives and
 * when the width changes, since both move the breaks.
 *
 * Before it is measured (and with JavaScript off) the text is plain, whole and visible. Each line
 * but the last ends in a space, so the text reads (and is named) as the one sentence it is.
 */
export function Lines({
  text,
  as: Tag = 'p',
  on,
  className,
  id,
}: {
  text: string;
  as?: ElementType;
  on: boolean;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [lines, setLines] = useState<string[] | null>(null);
  const [pass, setPass] = useState(0);

  // Measure: in the words pass, read each word's top and gather them.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || lines) return;
    const words = Array.from(el.querySelectorAll<HTMLElement>('[data-w]'));
    if (!words.length) return;
    const out: string[][] = [];
    let top: number | null = null;
    for (const w of words) {
      const t = w.offsetTop;
      if (top === null || Math.abs(t - top) > 4) {
        out.push([]);
        top = t;
      }
      out[out.length - 1].push(w.textContent ?? '');
    }
    setLines(out.map((l) => l.join(' ')));
  }, [lines, pass]);

  // Measure again when the font lands or the width changes by more than a scrollbar.
  useLayoutEffect(() => {
    let w0 = window.innerWidth;
    const again = () => {
      setLines(null);
      setPass((p) => p + 1);
    };
    const resize = () => {
      if (Math.abs(window.innerWidth - w0) > 40) {
        w0 = window.innerWidth;
        again();
      }
    };
    document.fonts?.ready.then(again);
    document.fonts?.addEventListener?.('loadingdone', again);
    window.addEventListener('resize', resize);
    return () => {
      document.fonts?.removeEventListener?.('loadingdone', again);
      window.removeEventListener('resize', resize);
    };
  }, []);

  let body: ReactNode;
  if (!lines) {
    body = text.split(' ').map((w, i) => (
      <span key={i}>
        {i > 0 && ' '}
        <span data-w style={{ display: 'inline-block' }}>
          {w}
        </span>
      </span>
    ));
  } else {
    body = lines.map((l, i) => (
      <span key={`${pass}-${i}`} className={styles.ln}>
        <span className={styles.li} style={{ '--k': i } as React.CSSProperties}>
          {l}
          {i < lines.length - 1 && ' '}
        </span>
      </span>
    ));
  }

  return (
    <Tag ref={ref} id={id} className={className} data-lines={lines ? (on ? 'on' : 'off') : 'words'}>
      {body}
    </Tag>
  );
}
