'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { LOCKUP_VIEWBOX, LOCKUP_WORD } from '@/components/home/lockup';
import { MARK_ACCENTS, MARK_LETTERS } from '@/components/home/mark';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import styles from './konstruksjonen.module.css';

/** The field: 1000 × 1100 user units, cells 125 wide (8 × 9; the view crops what does not fit). */
const W = 1000;
const H = 1100;
const C = 125;
const COLS = W / C;
const ROWS = Math.ceil(H / C);
const h = C / 2;
const q = h / Math.SQRT2;
/** The cell the construction is shown in, and the wave spreads from. */
const ORIGIN = { col: 3, row: 4 };

type Cell = { col: number; row: number; cx: number; cy: number; d: number };
const CELLS: Cell[] = [];
for (let row = 0; row < ROWS; row++)
  for (let col = 0; col < COLS; col++)
    CELLS.push({ col, row, cx: col * C + h, cy: row * C + h, d: Math.hypot(col - ORIGIN.col, row - ORIGIN.row) });

const pts = (p: [number, number][]) => `M${p.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`;
/** The eight-pointed star {8/2}: two squares, one on its point. Points at radius h, the inner corners at h·cos45°/cos22.5°. */
const star = (cx: number, cy: number) =>
  pts(
    Array.from({ length: 16 }, (_, i) => {
      const r = i % 2 === 0 ? h : (h * Math.cos(Math.PI / 4)) / Math.cos(Math.PI / 8);
      const a = (i * Math.PI) / 8 - Math.PI / 2;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
    }),
  );
const diamond = (cx: number, cy: number) => pts([[cx, cy - h], [cx + h, cy], [cx, cy + h], [cx - h, cy]]);
const square = (cx: number, cy: number) => pts([[cx - q, cy - q], [cx + q, cy - q], [cx + q, cy + q], [cx - q, cy + q]]);
/** From each corner of the upright square out to the cell's corner: where four cells meet, these close into the small cross. */
const links = (cx: number, cy: number) =>
  [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]
    .map(([sx, sy]) => `M${cx + sx * q} ${cy + sy * q}L${cx + sx * h} ${cy + sy * h}`)
    .join('');

/**
 * MOCK 8 Konstruksjonen. The tradition's other art: geometry. On the right, the eight-pointed star
 * is constructed as a pattern-maker constructs it, with compass and rule, in one cell: the square,
 * the circle, the diagonals and the axes, then the two squares that make the star. From that cell the
 * pattern spreads across the field in a wave, every star drawn line by line, until the field is the
 * whole lattice; the first star is filled in crimson. A pointer lights the star under it in
 * turquoise. On the left, the lockup, the paragraph and the two buttons, on white.
 */
export function Konstruksjonen() {
  const hero = useRef<HTMLElement>(null);
  const field = useRef<SVGSVGElement>(null);
  const [lit, setLit] = useState(-1);
  useEffect(() => {
    const id = requestAnimationFrame(() => hero.current?.setAttribute('data-in', ''));
    return () => cancelAnimationFrame(id);
  }, []);

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const svg = field.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    const col = Math.floor(p.x / C);
    const row = Math.floor(p.y / C);
    const i = row * COLS + col;
    setLit(col >= 0 && col < COLS && row >= 0 && row < ROWS ? i : -1);
  };

  const o = CELLS.find((c) => c.col === ORIGIN.col && c.row === ORIGIN.row)!;
  return (
    <section ref={hero} className={styles.hero} aria-labelledby="hovedtekst">
      <div className={styles.copy}>
        <h1 id="hovedtekst" className={styles.mark}>
          <svg viewBox={LOCKUP_VIEWBOX} role="img" aria-label={site.logoAlt}>
            {MARK_LETTERS.map((p, k) => (
              <path key={k} className={styles.letter} transform={p.transform} d={p.d} />
            ))}
            {LOCKUP_WORD.map((p, k) => (
              <path key={k} className={styles.letter} transform={p.transform} d={p.d} />
            ))}
            {MARK_ACCENTS.map((p, k) => (
              <path key={k} className={styles.accent} transform={p.transform} d={p.d} />
            ))}
          </svg>
        </h1>
        <p className={styles.lede}>{brief.home.paragraph}</p>
        <p className={styles.buttons}>
          <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
          <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
        </p>
      </div>
      <div className={styles.field}>
        <svg ref={field} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" onPointerMove={onMove} onPointerLeave={() => setLit(-1)}>
          {/* The construction, in the first cell: square, circle, diagonals, axes — drawn, then gone. */}
          <g className={styles.guides}>
            <path pathLength={1} style={{ '--g': 0 } as CSSProperties} d={pts([[o.cx - h, o.cy - h], [o.cx + h, o.cy - h], [o.cx + h, o.cy + h], [o.cx - h, o.cy + h]])} />
            <circle pathLength={1} style={{ '--g': 1 } as CSSProperties} cx={o.cx} cy={o.cy} r={h} />
            <path pathLength={1} style={{ '--g': 2 } as CSSProperties} d={`M${o.cx - h} ${o.cy - h}L${o.cx + h} ${o.cy + h}M${o.cx + h} ${o.cy - h}L${o.cx - h} ${o.cy + h}`} />
            <path pathLength={1} style={{ '--g': 3 } as CSSProperties} d={`M${o.cx} ${o.cy - h}L${o.cx} ${o.cy + h}M${o.cx - h} ${o.cy}L${o.cx + h} ${o.cy}`} />
          </g>
          {CELLS.map((c, i) => (
            <g key={i} className={styles.cell} style={{ '--w': c.d } as CSSProperties} data-first={c.d === 0 ? '' : undefined} data-lit={i === lit ? '' : undefined}>
              <path className={styles.fill} d={star(c.cx, c.cy)} />
              <path className={styles.line} pathLength={1} d={diamond(c.cx, c.cy)} />
              <path className={styles.line} pathLength={1} d={square(c.cx, c.cy)} />
              <path className={styles.line} pathLength={1} d={links(c.cx, c.cy)} />
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
