'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { brand } from '@/lib/film';
import type { InkHandle, InkPalette } from '@/lib/ink';
import { buildWhenQuietNear } from '@/lib/near';
import { createWater, type WaterFloor, type WaterHandle } from '@/lib/water';
import styles from './materials.module.css';

export type Material = 'ink' | 'water';

/** Which pen and which frost a card on this box takes: navy on a pale box, light on a dark one. */
export type Tone = 'light' | 'dark';

type Props = {
  material: Material;
  /** The ink's palette; the brand's turquoise ink unless said otherwise. */
  palette?: InkPalette;
  /** The water's floor; the brand's turquoise floor unless said otherwise. */
  floor?: WaterFloor;
  tone?: Tone;
  /** The name of the ground, for CSS that keys on it (the dot on crimson). */
  ground?: string;
  className?: string;
  /** `--ground` and `--still` for a box whose colour is not the stylesheet's. */
  style?: CSSProperties;
  /** Calmer water: rarer, lighter rain and a shallower stir (`WaterOptions.calm`). */
  calm?: boolean;
  /** Told the handle once the simulation is built — for whoever wants to stir it. Never told about one that declined. */
  onMaterial?: (live: InkHandle | WaterHandle) => void;
  /** Not built before this moment on the page's clock (`NearOptions.after`): the home page's sea waits out the hero's opening. */
  after?: () => number;
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
 * The ink's code is loaded only by a box that asks for ink: no page uses it now, and it
 * should cost the pages that do not nothing.
 *
 * The pointer is tracked on the box, not on the canvas, so a hand moving over the copy
 * stirs the material behind it: the frames are lines drawn on the water, not lids on it.
 */
export function Box({ material, palette, floor, tone = 'light', ground, className, style, calm = false, onMaterial, after, children }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const paint = useRef<HTMLCanvasElement>(null);
  const told = useRef(onMaterial);

  useEffect(() => {
    told.current = onMaterial;
  }, [onMaterial]);

  useEffect(() => {
    const host = root.current;
    const canvas = paint.current;
    if (!host || !canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let live: InkHandle | WaterHandle | null = null;
    let gone = false;
    const cancel = buildWhenQuietNear(canvas, () => {
      if (material === 'ink') {
        void import('@/lib/ink').then(({ createInk }) => {
          if (gone) return;
          live = createInk(canvas, { reduced: false, palette: palette ?? brand.ink, host });
          if (live) told.current?.(live);
        });
        return;
      }
      live = createWater(canvas, { reduced: false, floor: floor ?? brand.floor, host, calm });
      if (live) told.current?.(live);
    }, { after });
    return () => {
      gone = true;
      cancel();
      live?.destroy();
    };
  }, [material, palette, floor, calm, after]);

  return (
    <div
      ref={root}
      className={`${styles.box} ${styles[material]} ${className ?? ''}`}
      style={style}
      data-material={material}
      data-tone={tone}
      data-ground={ground}
    >
      <canvas ref={paint} className={styles.paint} data-paint aria-hidden="true" />
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
