import Link from 'next/link';
import type { CSSProperties, ReactNode, Ref } from 'react';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import styles from './band.module.css';

type Props = {
  /** White type for a dark place (the default), navy for a light one. */
  tone?: 'light' | 'dark';
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
  /** Wraps the headline's text — a direction that lights or sweeps it puts its span here. */
  title?: (text: string) => ReactNode;
  onButton?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

/**
 * The copy as its own section, in the width (round three, 2026-09-19): the headline on the
 * left, the paragraph and the two buttons on the right, so the three take a band across
 * the page rather than a column down it. A phone stacks them, tighter than the live hero.
 */
export function Band({ tone = 'light', className, style, ref, title, onButton }: Props) {
  return (
    <div ref={ref} className={`${styles.band} ${className ?? ''}`} data-tone={tone} style={style}>
      <h1 id="hovedtekst" className={styles.title}>{title ? title(brief.home.headline) : brief.home.headline}</h1>
      <div className={styles.side}>
        <p className={styles.lede}>{brief.home.paragraph}</p>
        <p className={styles.buttons}>
          <Link href={site.cta.work.href} prefetch={false} className={styles.work} onMouseEnter={onButton}>{site.cta.work.label}</Link>
          <Link href={site.cta.support.href} prefetch={false} className={styles.support} onMouseEnter={onButton}>{site.cta.support.label}</Link>
        </p>
      </div>
    </div>
  );
}
