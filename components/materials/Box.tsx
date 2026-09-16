'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { brand } from '@/lib/film';
import { createInk, type InkHandle } from '@/lib/ink';
import { buildWhenQuietNear } from '@/lib/near';
import { createWater, type WaterHandle } from '@/lib/water';
import styles from './materials.module.css';

export type Material = 'ink' | 'water';

type Props = {
  material: Material;
  className?: string;
  children: ReactNode;
};

/**
 * A box of material: a rounded plate of ink or of water, holding what is put in it.
 *
 * The colour is in CSS from the first paint (`.ink`, `.water` in materials.module.css) and
 * the simulation is built later — once the box is near the viewport AND the page is quiet
 * (`buildWhenQuietNear`), so its shaders never compile in the middle of a scroll. It is
 * built directly rather than through `createInkWhenNear`, which waits only for near.
 * Under reduced motion nothing is built: the still is the whole answer, as it is on a
 * device that declines WebGL2 (both simulations return null there and the canvas stays
 * transparent over the still).
 *
 * The pointer is tracked on the box, not on the canvas, so a hand moving over the copy
 * stirs the material behind it: the frames are lines drawn on the water, not lids on it.
 */
export function Box({ material, className, children }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const paint = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = root.current;
    const canvas = paint.current;
    if (!host || !canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let live: InkHandle | WaterHandle | null = null;
    const cancel = buildWhenQuietNear(canvas, () => {
      live = material === 'ink'
        ? createInk(canvas, { reduced: false, palette: brand.ink, host })
        : createWater(canvas, { reduced: false, floor: brand.floor, host });
    });
    return () => {
      cancel();
      live?.destroy();
    };
  }, [material]);

  return (
    <div ref={root} className={`${styles.box} ${styles[material]} ${className ?? ''}`} data-material={material}>
      <canvas ref={paint} className={styles.paint} data-paint aria-hidden="true" />
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
