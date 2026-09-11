import { site } from '@/content/site.no';
import styles from './vision.module.css';

/**
 * The stage: the tree's canvas and the name under its roots. Vision mounts the renderer on
 * it and places it; the renderer sets where the name sits and fades it in with the roots.
 * The name is the hero's lockup — the same two lines from the content file, so the two
 * cannot drift apart — and Vision tracks the second out to the first's width.
 */
export function Tree() {
  const [first, second] = site.hero.wordLines;
  return (
    <div className={styles.stage} data-tree role="figure" aria-label={site.vision.tree.label}>
      <canvas className={styles.canvas} aria-hidden="true" />
      <p className={styles.mark} data-root>
        <span className={styles.markFirst} data-mark-first>{first}</span>
        <span className={styles.markSecond} data-mark-second>{second}</span>
      </p>
    </div>
  );
}
