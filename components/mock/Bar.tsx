'use client';

import Link from 'next/link';
import { DIRS, ROUNDS, type Dir } from './dirs';
import styles from './bar.module.css';

/** The strip: the three directions at the foot of the screen, a line on the one showing. Mock furniture, not part of any direction. */
export function Bar({ dir }: { dir: Dir }) {
  const d = DIRS.find((x) => x.key === dir)!;
  return (
    <div className={styles.strip} role="group" aria-label="Utkast">
      <p className={styles.note}>{d.note}</p>
      <div className={styles.tabs}>
        {ROUNDS.map((round, i) => (
          <div key={i} className={styles.group} data-current={round.includes(dir) ? '' : undefined}>
            {round.map((key) => {
              const x = DIRS.find((y) => y.key === key)!;
              return (
                <Link key={key} href={`/mock/${key}`} prefetch={false} className={styles.tab} aria-current={key === dir ? 'page' : undefined}>{x.name}</Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
