'use client';

import { useRef } from 'react';
import type { AreaKey } from '@/lib/content';
import type { InkHandle } from '@/lib/ink';
import type { WaterHandle } from '@/lib/water';
import { areas } from './areas';
import { Arrive } from './Arrive';
import { Fields } from './Fields';
import { Scene } from './Scene';
import styles from './scene.module.css';

type Material = InkHandle | WaterHandle;

/** Between one field's stone and the next, when the mosaic locks open. */
export const STIR_GAP = 110;

/**
 * The four fields as one scene: the mosaic opens to the screen as it passes the middle,
 * and when it locks open a stone drops in each field's water, one after another in the
 * areas' order. The fields arrive one after another (`Arrive` round the scene, so the
 * scene's own first child is still the plate the clip works on).
 */
export function Mosaic() {
  const waters = useRef<Partial<Record<AreaKey, Material>>>({});
  return (
    <Arrive as="div">
      <Scene
        className={styles.mosaic}
        onOpen={(open) => {
          if (!open) return;
          areas.forEach((a, i) => window.setTimeout(() => waters.current[a.key]?.stir(0.5, 0.5), i * STIR_GAP));
        }}
      >
        <Fields calm onMaterial={(key, live) => { waters.current[key] = live; }} />
      </Scene>
    </Arrive>
  );
}
