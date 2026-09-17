import { Fragment, type CSSProperties } from 'react';
import styles from './words.module.css';

/**
 * A statement word by word, for the arrival to bring up one after another: each word in
 * its own span with its place in `--w`, a final full stop in a span of its own inside the
 * last word (crimson: the logo's dot). The text content is the input unchanged, so the
 * brief's verbatim test and a screen reader both read the sentence as written.
 */
export function Words({ text }: { text: string }) {
  const stop = text.endsWith('.');
  const words = (stop ? text.slice(0, -1) : text).split(' ');
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span className={styles.word} style={{ '--w': i } as CSSProperties} data-word>
            {word}
            {stop && i === words.length - 1 && <span className={styles.stop} data-stop>.</span>}
          </span>
        </Fragment>
      ))}
    </>
  );
}
