import { site } from '@/content/site.no';
import styles from './vision.module.css';

/** The canvas box; Vision mounts the renderer on it. The names are real text for readers. */
export function Tree() {
  return (
    <div className={styles.tree} data-tree role="figure" aria-label={site.vision.tree.label}>
      <canvas className={styles.canvas} aria-hidden="true" />
      {site.vision.tree.limbs.map((name) => (
        <span key={name} className={styles.limbName} data-limb>{name}</span>
      ))}
      <span className={styles.rootName} data-root>{site.vision.tree.root}</span>
    </div>
  );
}
