'use client';

import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from 'react';
import { clamp, eo, onScrollFrame } from '@/components/forside/frame';
import f from '@/components/forside/forside.module.css';
import { useCopy } from '@/components/site/Lang';
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
 * The page's opening (mock 54 «Rett på», the owner's pick of 2026-11-20: no whole screen for the page's
 * name, «a small part, and then we go to the actual content»): the title, the intro and the page's parts
 * stand in a column at the left that stays while the content runs from the top at the right. On a phone
 * the column stands over the content and the content runs the full width.
 */
type Part = { id: string; label: string };

type Props = { id?: string; text?: string; label?: string; children?: ReactNode };

/** The text an element holds: its strings, and a `Lines` heading's `text`. */
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (!isValidElement<Props>(node)) return '';
  return node.props.text ?? textOf(node.props.children);
}

/** The element with this id among `node`'s descendants. */
function findId(node: ReactNode, id: string): ReactNode {
  if (Array.isArray(node)) {
    for (const n of node) {
      const hit = findId(n, id);
      if (hit) return hit;
    }
    return null;
  }
  if (!isValidElement<Props>(node)) return null;
  if (node.props.id === id) return node;
  return findId(node.props.children, id);
}

/**
 * The page's parts, read from the plates as they are rendered: every plate after the first, named by
 * the heading its `label` points at. Done during render, not after loading, so on a phone (where the
 * list stands over the content) the list is in the first paint and nothing below it moves (CLS 0.17 on
 * /om-oss before, SEO audit 2026-11-25).
 */
export function partsFrom(children: ReactNode): Part[] {
  return Children.toArray(children)
    .slice(1)
    .map((plate) => {
      const id = isValidElement<Props>(plate) ? plate.props.label?.split(' ')[0] : undefined;
      if (!id || !isValidElement<Props>(plate)) return null;
      const label = textOf(findId(plate.props.children, id)).replace(/\s+/g, ' ').trim();
      return label ? { id, label } : null;
    })
    .filter((x): x is Part => !!x);
}

export function Plater({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { site } = useCopy();
  const [parts, setParts] = useState<Part[]>(() => partsFrom(children));
  const [here, setHere] = useState<string>();

  // the page's parts, named by their own headings, and which of them is being read
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // the header's height, so the column and the content stand right under it
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
    // the page as it stands has the last word, but an unchanged list must not render again
    setParts((had) => (JSON.stringify(had) === JSON.stringify(found) ? had : found));
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
  }, []);

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
  }, []);

  const list = Children.toArray(children);

  return (
    <div ref={ref} className={`${styles.plater} ${className ?? ''}`} data-plater="">
      <aside className={styles.side}>
        {list[0]}
        {parts.length > 1 && (
          <nav className={styles.toc} aria-label={site.onThisPage}>
            {parts.map((p) => (
              <a key={p.id} href={`#${p.id}`} aria-current={here === p.id ? 'true' : undefined}>
                {p.label}
              </a>
            ))}
          </nav>
        )}
      </aside>
      <div className={styles.rest}>{list.slice(1)}</div>
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
