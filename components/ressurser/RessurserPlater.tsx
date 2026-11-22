import { Lines } from '@/components/forside/Lines';
import { Plate, Plater, type Tone } from '@/components/plater/Plater';
import { after } from '@/components/plater/after';
import p from '@/components/plater/plater.module.css';
import { Morph } from '@/components/site/Morph';
import { morphName } from '@/components/site/TitleLink';
import { copy } from '@/content/copy';
import type { Lang } from '@/content/paths';
import type { Resource } from '@/lib/content';
import { Utgivelse } from './Utgivelse';
import styles from './ressurser-plater.module.css';

/** The categories' grounds after the white title plate, in their order: no two neighbours alike. */
const TONES: Tone[] = ['navy', 'white', 'rod', 'deep'];

/**
 * Ressurser as «Platene» (mock 42, the owner's pick of 2026-11-20): the title and the client's intro on
 * white, then a plate for each of the four categories in the client's order, its title at poster size,
 * the client's text beside it where they gave one, and what is published in it as a list between rules,
 * newest first (or the empty line). Each category keeps its anchor (`#<key>`), so the old
 * Styringsdokumenter address lands on its plate. A video plays on the page (Utgivelse).
 */
export function RessurserPlater({ items, lang = 'no' }: { items: Resource[]; lang?: Lang }) {
  const { klient, site } = copy(lang);
  const t = site.pages.resources;
  const r = klient.resources;
  return (
    <Plater>
      <Plate tone="white" label="ressurser-tittel">
        <Morph name={morphName('/ressurser')}>
          <Lines as="h1" id="ressurser-tittel" className={p.h1} text={r.title} />
        </Morph>
        <p className={p.intro} data-rise="">
          {r.intro}
        </p>
      </Plate>

      {r.categories.map((c, ci) => {
        const inIt = items.filter((i) => i.category === c.key);
        const label = `${c.key}-tittel`;
        return (
          <Plate key={c.key} tone={TONES[ci % TONES.length]} id={c.key} label={label} className={styles.cat} data-category={c.key}>
            <Lines as="h2" id={label} className={p.h} text={c.title} />
            {c.text && (
              <p className={`${p.lede} ${styles.side}`} data-rise="">
                {c.text}
              </p>
            )}
            {inIt.length ? (
              <ul className={styles.list}>
                {inIt.map((i, n) => (
                  <Utgivelse key={i.slug} r={i} style={after(n * 0.08)} lang={lang} />
                ))}
              </ul>
            ) : (
              <p className={styles.empty} data-rise="">
                {t.empty}
              </p>
            )}
          </Plate>
        );
      })}
    </Plater>
  );
}
