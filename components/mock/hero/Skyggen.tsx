import { Hybrid } from './Hybrid';
import styles from './skyggen.module.css';

/**
 * MOCK 18 Skyggen. The fullest of the three: 15 Hilsenen and 14 Lyset as one. The hero is a view —
 * Oslo's sky over a floor a step darker, the horizon running behind the name's baseline — and on
 * arrival the day plays up to now (from first light by day, from last night's sunset at night)
 * while the name steps out of the header. Once it has landed it casts the real cast of this
 * minute on the floor, the sun's or at night the moon's, swinging round with the last of the
 * replay and settling where the light is now. Scrolled on, the cast fades as the name goes back
 * into the header.
 */
export function Skyggen() {
  return <Hybrid replay cast className={styles.skyggen} ground={<div className={styles.floor} aria-hidden="true" />} />;
}
