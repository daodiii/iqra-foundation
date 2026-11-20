'use client';

import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import { clamp, eo, onScrollFrame } from '@/components/forside/frame';
import f from '@/components/forside/forside.module.css';
import styles from './plater.module.css';

/** The plates' grounds: white, navy, the deep navy of the foot, and burgundy (three colours, 2026-11-20). */
export type Tone = 'white' | 'navy' | 'deep' | 'rod';

/**
 * How closed a plate still is (1 closed, 0 open) when its top stands `top` px from the top of a screen
 * `h` tall: closed while it waits under the screen, open once its top has come three quarters of the
 * way up, eased out so it opens quickly and lands softly (mock 42 «Platene», 2026-11-20).
 */
export function closedAt(top: number, h: number): number {
  if (h <= 0) return 0;
  return 1 - eo(clamp((h - top) / (h * 0.75)));
}

/** At closed `k`: inset from the top 10% of the screen's height, from each side 7% of its width, rounded 36 px. */
export function inset(k: number, w: number, h: number) {
  return { top: k * h * 0.1, side: k * w * 0.07, round: k * 36 };
}

/**
 * «Platene», the subpages' system (the owner's pick of mock 42, 2026-11-20): each part of a page is a
 * full-screen plate in one ground, its heading at poster size on a 12-column grid. As a plate comes up
 * it opens from a rounded panel set into the plate before it to the whole screen; the first plate is
 * open from the start. Texts marked `data-rise` fade up once they are on screen; headings arrive line
 * by line (`Lines`). Without JavaScript, or with reduced motion, every plate stands open and every text
 * is there.
 */
/**
 * The page's opening, three ways (mocks 52–54, 2026-11-20; the owner: no whole screen for the page's
 * name, «a small part, and then we go to the actual content»): 52 a short masthead, 53 the same with a
 * row of the page's parts that stays under the header, 54 the title and the parts in a column at the
 * left while the content starts at the right. PREVIEW: `?apning=52|53|54` picks one and shows a switcher.
 */
const OPENINGS = ['52', '53', '54'] as const;
type Opening = (typeof OPENINGS)[number];
type Part = { id: string; label: string };

export function Plater({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [opening, setOpening] = useState<Opening>('52');
  const [preview, setPreview] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [here, setHere] = useState<string>();

  useEffect(() => {
    // PREVIEW BRANCH ONLY: the switcher shows without a query, since Vercel's preview login drops it
    // (memory: vercel-preview-login-drops-query). Remove with the switcher before this is merged.
    setPreview(true);
    const q = new URLSearchParams(window.location.search).get('apning');
    if (q && (OPENINGS as readonly string[]).includes(q)) setOpening(q as Opening);
  }, []);

  // the page's parts, named by their own headings, and which of them is being read
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // the header's height, so the row of parts (53) and the column (54) stand right under it
    const bar = document.querySelector<HTMLElement>('[data-topp]');
    const measure = () => el.style.setProperty('--top-h', `${Math.round(bar?.getBoundingClientRect().bottom ?? 91)}px`);
    measure();
    window.addEventListener('resize', measure);
    const plates = Array.from(el.querySelectorAll<HTMLElement>('[data-plate]')).slice(1);
    const found = plates
      .map((p) => {
        const id = p.getAttribute('aria-labelledby')?.split(' ')[0];
        const h = id ? document.getElementById(id) : null;
        return id && h ? { id, label: (h.textContent ?? '').replace(/\s+/g, ' ').trim() } : null;
      })
      .filter((x): x is Part => !!x && !!x.label);
    setParts(found);
    if (typeof IntersectionObserver === 'undefined') return () => window.removeEventListener('resize', measure);
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setHere(e.target.getAttribute('aria-labelledby')?.split(' ')[0])),
      { rootMargin: '-40% 0px -55% 0px' },
    );
    plates.forEach((p) => io.observe(p));
    return () => {
      io.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [opening]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const plates = Array.from(el.querySelectorAll<HTMLElement>('[data-plate]')).slice(1);

    const tick = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      for (const p of plates) {
        const k = reduce.matches ? 0 : closedAt(p.getBoundingClientRect().top, H);
        const c = inset(k, W, H);
        p.style.setProperty('--ci', `${c.top.toFixed(1)}px`);
        p.style.setProperty('--cx', `${c.side.toFixed(1)}px`);
        p.style.setProperty('--cr', `${c.round.toFixed(1)}px`);
      }
    };
    const stop = onScrollFrame(el, tick);

    const rises = Array.from(el.querySelectorAll<HTMLElement>('[data-rise]'));
    const show = (x: HTMLElement) => (x.dataset.in = '');
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === 'undefined' || reduce.matches) rises.forEach(show);
    else {
      io = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (!e.isIntersecting) return;
            show(e.target as HTMLElement);
            io?.unobserve(e.target);
          }),
        { rootMargin: '0px 0px -8% 0px' },
      );
      rises.forEach((x) => io!.observe(x));
    }
    return () => {
      stop();
      io?.disconnect();
    };
  }, [opening]);

  const list = Children.toArray(children);
  const toc =
    parts.length > 1 ? (
      <nav className={styles.toc} aria-label="På denne siden">
        {parts.map((p) => (
          <a key={p.id} href={`#${p.id}`} aria-current={here === p.id ? 'true' : undefined}>
            {p.label}
          </a>
        ))}
      </nav>
    ) : null;

  return (
    <div ref={ref} className={`${styles.plater} ${className ?? ''}`} data-plater="" data-open={opening}>
      {opening === '54' ? (
        <>
          <aside className={styles.side54}>
            {list[0]}
            {toc}
          </aside>
          <div className={styles.rest54}>{list.slice(1)}</div>
        </>
      ) : (
        <>
          {list[0]}
          {opening === '53' && toc}
          {list.slice(1)}
        </>
      )}
      {preview && (
        <div className={styles.switch} role="group" aria-label="Åpning (forhåndsvisning)">
          {OPENINGS.map((o) => (
            <button key={o} type="button" aria-pressed={opening === o} onClick={() => setOpening(o)}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One plate: a section in its ground, named by its heading (`label`, the heading's id). `mid` stands its
 * content in the middle of the screen instead of at the foot.
 */
export function Plate({
  tone,
  label,
  id,
  mid,
  className,
  children,
  ...rest
}: {
  tone: Tone;
  label?: string;
  id?: string;
  mid?: boolean;
  className?: string;
  children: ReactNode;
} & Record<`data-${string}`, string | undefined>) {
  return (
    <section
      id={id}
      aria-labelledby={label}
      className={`${styles.plate} ${styles[tone]} ${mid ? styles.mid : ''} ${f.pad} ${className ?? ''}`}
      data-plate={tone}
      {...rest}
    >
      <div className={styles.in}>{children}</div>
    </section>
  );
}
