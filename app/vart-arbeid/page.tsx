import type { Metadata } from 'next';
import { Box, type Material } from '@/components/materials/Box';
import { Frame } from '@/components/materials/Frame';
import mat from '@/components/materials/materials.module.css';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import styles from './work.module.css';

export const metadata: Metadata = {
  title: site.pages.work.title,
  description: site.pages.work.description,
};

/**
 * The materials alternate down the page — ink, water, ink, water — and the card sits left
 * on ink and right on water, so a visitor can tell which area they are in by the plate and
 * its side as well as by the name on the line.
 */
const MATERIAL: readonly Material[] = ['ink', 'water', 'ink', 'water'];

/**
 * Vårt arbeid: the four areas (6), each its own section and its own box of material, each
 * linkable by its key (`#kunnskap` lands on it, under the header). The title and the
 * mission headline as the lede stand on the page's white above the first box.
 */
export default function VartArbeid() {
  return (
    <article className={styles.work} data-plates>
      <header className={styles.head}>
        <h1 className={styles.title}>{site.pages.work.title}</h1>
        <p className={styles.lede}>{brief.mission.headline}</p>
      </header>
      <div className={styles.plates}>
        {brief.areas.map((a, i) => (
          <section
            key={a.key}
            id={a.key}
            className={`${styles.area} ${i % 2 ? styles.right : styles.left}`}
            aria-labelledby={`${a.key}-tittel`}
          >
            <Box material={MATERIAL[i]} className={styles.box}>
              <Frame legend={a.name} legendId={`${a.key}-tittel`} level="h2" dot className={styles.card}>
                <p className={mat.text}>{a.text}</p>
              </Frame>
            </Box>
          </section>
        ))}
      </div>
    </article>
  );
}
