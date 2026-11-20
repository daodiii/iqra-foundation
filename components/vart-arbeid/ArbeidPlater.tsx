import { Lines } from '@/components/forside/Lines';
import { Plate, Plater, type Tone } from '@/components/plater/Plater';
import { after } from '@/components/plater/after';
import p from '@/components/plater/plater.module.css';
import styles from './arbeid-plater.module.css';

export type Area = { id: string; title: string; text: string; note?: string };

/** The coloured grounds the areas take in turn; every other area stands on white between them. */
const COLOURS: Tone[] = ['navy', 'rod', 'navy'];

/** A word this long cannot stand at poster size in seven of the twelve columns. */
const LONG_WORD = 16;
/** A text this long is too much to set as a statement. */
const SAY_MAX = 240;

type Layout = 'wide' | 'say' | 'row';

/**
 * How an area is set, so the seven do not read as seven times the same screen: a heading with a
 * word too long for seven columns («kompetanseutvikling», «Kunnskapsformidling») takes the whole
 * width, its text under it; on a coloured ground a short text is set large as a statement under a
 * small heading; otherwise the heading stands at left with the text at right.
 */
function layoutOf(a: Area, coloured: boolean): Layout {
  const longest = Math.max(...a.title.split(/\s+/).map((w) => w.replace(/[^\p{L}]/gu, '').length));
  if (longest >= LONG_WORD) return 'wide';
  if (coloured && a.text.length <= SAY_MAX) return 'say';
  return 'row';
}

function AreaPlate({ a, i }: { a: Area; i: number }) {
  const coloured = i % 2 === 0;
  const tone: Tone = coloured ? COLOURS[(i / 2) % COLOURS.length] : 'white';
  const layout = layoutOf(a, coloured);
  const h = `${a.id}-tittel`;
  return (
    <Plate tone={tone} id={a.id} label={h} mid={layout === 'say'} data-area={layout}>
      {layout === 'say' ? (
        <>
          <h2 id={h} className={p.small} data-rise="">
            {a.title}
          </h2>
          <p className={`${p.say} ${styles.say}`} data-rise="" style={after(0.1)}>
            {a.text}
          </p>
          {a.note && (
            <p className={p.note} data-rise="" style={after(0.2)}>
              {a.note}
            </p>
          )}
        </>
      ) : layout === 'wide' ? (
        <>
          <Lines as="h2" id={h} className={`${p.h} ${styles.h} ${styles.wide}`} text={a.title} />
          {a.note ? (
            <div className={p.two}>
              <p data-rise="">{a.text}</p>
              <p data-rise="" style={after(0.1)}>
                {a.note}
              </p>
            </div>
          ) : (
            <p className={styles.drop} data-rise="">
              {a.text}
            </p>
          )}
        </>
      ) : (
        <>
          <Lines as="h2" id={h} className={`${p.h} ${styles.h}`} text={a.title} />
          <div className={styles.side}>
            <p className={styles.text} data-rise="">
              {a.text}
            </p>
            {a.note && (
              <p className={styles.sideNote} data-rise="" style={after(0.1)}>
                {a.note}
              </p>
            )}
          </div>
        </>
      )}
    </Plate>
  );
}

/**
 * Vårt arbeid as «Platene» (mock 42, the owner's pick of 2026-11-20): the title and the intro on white,
 * then each area of work as its own plate in the client's order and words, coloured grounds (navy,
 * burgundy, navy) taking turns with white. Each plate carries the area's anchor, so links from other
 * pages land on it, and is named by the area's title.
 */
export function ArbeidPlater({ title, intro, areas }: { title: string; intro: string; areas: Area[] }) {
  return (
    <Plater>
      <Plate tone="white" label="arbeid-tittel">
        <Lines as="h1" id="arbeid-tittel" className={p.h1} text={title} />
        <p className={p.intro} data-rise="">
          {intro}
        </p>
      </Plate>
      {areas.map((a, i) => (
        <AreaPlate key={a.id} a={a} i={i} />
      ))}
    </Plater>
  );
}
