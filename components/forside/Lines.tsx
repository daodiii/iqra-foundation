'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';
import styles from './forside.module.css';

/**
 * The page's one way for text to arrive (the owner, 2026-11-20: the text should «show up in a certain
 * manner and speed»; mock 31 «Linjene» picked over 32 «Ordene», word by word): each line rises out of
 * its own mask, one after the next (forside.module.css).
 *
 * The lines are the ones the browser lays out: the text is first set as words, each word's top is
 * read, and the words are gathered into lines. It is measured again when the web font arrives and when
 * the width changes, since both move the breaks.
 *
 * When it goes: `on`, from a scene that times it (the crimson dot, Sporet); with no `on`, or where the
 * media query `auto` matches, it goes by itself once it is well onto the screen. `delay` (ms) holds it
 * back, so a text under a heading follows it.
 *
 * With JavaScript off the text is plain, whole and visible. Words are separated by spaces, so the text
 * reads (and is named) as the one sentence it is.
 */
export function Lines({
  text,
  as: Tag = 'p',
  on,
  auto,
  delay = 0,
  className,
  id,
}: {
  text: string;
  as?: ElementType;
  on?: boolean;
  auto?: string;
  delay?: number;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [lines, setLines] = useState<string[][] | null>(null);
  const [pass, setPass] = useState(0);
  // with no IntersectionObserver to wait for (old browsers, tests) a text that goes by itself is shown
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');
  const [self, setSelf] = useState(on === undefined);

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
    setLines(out);
  }, [lines, pass]);

  // Measure again when the font lands or the text's own box changes width (a resize, or a scene that
  // sizes its container after mounting, as the crimson dot does). A phone's address bar changes only the height.
  useLayoutEffect(() => {
    const el = ref.current;
    let w0 = el?.getBoundingClientRect().width ?? 0;
    const again = () => {
      setLines(null);
      setPass((p) => p + 1);
    };
    const ro =
      el && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(([e]) => {
            const w = e.contentRect.width;
            if (Math.abs(w - w0) > 1) {
              w0 = w;
              again();
            }
          })
        : null;
    if (el) ro?.observe(el);
    document.fonts?.ready.then(again);
    document.fonts?.addEventListener?.('loadingdone', again);
    return () => {
      document.fonts?.removeEventListener?.('loadingdone', again);
      ro?.disconnect();
    };
  }, []);

  // Going by itself: once, when it is well onto the screen.
  const scene = on !== undefined;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (scene && !(auto && window.matchMedia(auto).matches)) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([e]) => {
        setSelf(true);
        if (!e.isIntersecting) return;
        setSeen(true);
        io.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [auto, scene]);

  const shown = self ? seen : !!on;

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
        <span className={styles.li} style={{ '--k': i } as CSSProperties}>
          {l.join(' ')}
          {i < lines.length - 1 && ' '}
        </span>
      </span>
    ));
  }

  return (
    <Tag
      ref={ref}
      id={id}
      className={className}
      data-lines={lines ? (shown ? 'on' : 'off') : 'words'}
      style={delay ? ({ '--d': `${delay}ms` } as CSSProperties) : undefined}
    >
      {body}
    </Tag>
  );
}
